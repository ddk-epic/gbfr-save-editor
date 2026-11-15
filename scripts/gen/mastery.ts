import { hashId } from "../../packages/core/xxhash32-custom";
import { UNNAMED_KEY, type Context } from "./context";
import { loadLimitBonus } from "./limit-bonus";

export function genMastery(ctx: Context) {
  const { db, emit } = ctx;
  // Mastery params that add sigil slots.
  const slotParams = (
    db
      .prepare(
        "select Key from limit_bonus_param where NameFormat = 'TXT_LBP_INFO_CMN_PARAM_GNS'",
      )
      .all() as { Key: string }[]
  ).map(({ Key }) => Key);
  emit(
    "mastery",
    `/** limit_bonus_param.Key of "Sigil Slot +{0}". */
export const SIGIL_SLOT_PARAMS: readonly string[] = ${JSON.stringify(slotParams.sort())};`,
  );
  console.log(`SIGIL_SLOT_PARAMS: ${slotParams.length}`);

  // Masteries nodes: per character and limit_bonus key, a [section, MspCost,
  // NodeGridLocation, series] cell per LimitBonusParamIndex, the bit 1602 sets
  // when the node is taken. Collection and Transcendence rows name their weapon,
  // whose weapon.Unk30 is the node's series; one ladder can span series.
  const SECTIONS = [
    "offense",
    "offenseExtension",
    "defense",
    "defenseExtension",
    "collection",
    "transcendence",
  ] as const;
  /** T1-6 transcendence rows, never set; the T7 rows hold the bought nodes. */
  const REPLACED_TRANSCENDENCE = SECTIONS.length;
  const nodes = new Map<string, Map<number, number[][]>>();
  const seriesOf = new Map(
    (
      db.prepare("select Key, Unk30 as series from weapon").all() as {
        Key: string;
        series: number;
      }[]
    ).map(({ Key, series }) => [Key, series]),
  );
  /** limit_bonus key hash -> key. */
  const bonusKeys = new Map<number, string>();
  let nodeCount = 0;
  let gaps = 0;
  for (const tree of [
    "ap_tree_atk",
    "ap_tree_def",
    "ap_tree_wep",
    "ap_tree_rebuild",
  ]) {
    const rows = db
      .prepare(
        `select CharaId, LimitBonusId, LimitBonusParamIndex, MspCost, NodeGridLocation, DiffSeparatorMaybe, ReqWepTranscensionLevel, WeaponId from "${tree}"`,
      )
      .all() as {
      CharaId: string;
      WeaponId: string;
      LimitBonusId: string;
      LimitBonusParamIndex: number;
      MspCost: number;
      NodeGridLocation: number;
      DiffSeparatorMaybe: number;
      ReqWepTranscensionLevel: number;
    }[];
    for (const row of rows) {
      // The 100-150% extension sits at DiffSeparatorMaybe 311 and up.
      const extension = row.DiffSeparatorMaybe >= 300 ? 1 : 0;
      const section =
        tree === "ap_tree_atk"
          ? 0 + extension
          : tree === "ap_tree_def"
            ? 2 + extension
            : tree === "ap_tree_wep"
              ? 4
              : row.ReqWepTranscensionLevel === 7
                ? 5
                : REPLACED_TRANSCENDENCE;
      const hash = UNNAMED_KEY.test(row.LimitBonusId)
        ? parseInt(row.LimitBonusId, 16)
        : hashId(row.LimitBonusId);
      bonusKeys.set(hash, row.LimitBonusId);
      let byBonus = nodes.get(row.CharaId);
      if (!byBonus) nodes.set(row.CharaId, (byBonus = new Map()));
      const ladder = byBonus.get(hash) ?? [];
      byBonus.set(hash, ladder);
      if (ladder[row.LimitBonusParamIndex])
        throw new Error(
          `${tree}: ${row.CharaId} ${row.LimitBonusId} index ${row.LimitBonusParamIndex} twice`,
        );
      const cell = [section, row.MspCost, row.NodeGridLocation];
      if (tree === "ap_tree_wep" || tree === "ap_tree_rebuild") {
        const series = seriesOf.get(row.WeaponId);
        if (series === undefined)
          throw new Error(
            `${tree}: ${row.CharaId} weapon ${row.WeaponId} not in weapon`,
          );
        cell.push(series);
      }
      ladder[row.LimitBonusParamIndex] = cell;
      nodeCount++;
    }
  }

  // Node effects: limit_bonus ParamId1-3 name up to three limit_bonus_param
  // effects, each filling {0} of its own format text with Lv{n}Value at
  // LimitBonusParamIndex n - 1. T7 transcendence texts read {0} from Lv9Value,
  // the T1-6 value, and the <d> bonus {1} from Lv10Value.
  const { bonusParams, paramValues } = loadLimitBonus(ctx);
  const usedParams = new Set<string>();
  const bonusBlock = [...bonusKeys]
    .sort(([a], [b]) => a - b)
    .map(([hash, key]) => {
      const params = (bonusParams.get(key) ?? []).filter((param) =>
        paramValues.has(param),
      );
      params.forEach((param) => usedParams.add(param));
      return `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify([key, ...params])},`;
    });
  const paramBlock = [...usedParams]
    .sort()
    .map(
      (param) =>
        `  ${JSON.stringify(param)}: ${JSON.stringify(paramValues.get(param))},`,
    );
  const characterBlocks = [...nodes]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chara, byBonus]) => {
      const entries = [...byBonus]
        .sort(([a], [b]) => a - b)
        .map(([hash, ladder]) => {
          // 1602 keeps one byte of node bits.
          if (ladder.length > 8)
            throw new Error(`${chara} #${hash.toString(16)}: index past 7`);
          const cells = Array.from(ladder, (node) =>
            node ? `[${node.join(", ")}]` : "null",
          );
          gaps += cells.filter((cell) => cell === "null").length;
          return `    0x${hash.toString(16).padStart(8, "0")}: [${cells.join(", ")}],`;
        });
      return [`  ${chara}: {`, ...entries, "  },"].join("\n");
    });
  emit(
    "mastery",
    `export const MASTERY_SECTIONS = ${JSON.stringify(SECTIONS)} as const;

/** Section index of T1-6 transcendence rows, never set; the T7 rows hold the bought nodes. */
export const REPLACED_TRANSCENDENCE = ${REPLACED_TRANSCENDENCE};

/**
 * ap_tree_* nodes, ${nodeCount} rows: chara.CharId -> limit_bonus key hash ->
 * [section index, MspCost, NodeGridLocation, weapon series] per
 * LimitBonusParamIndex, null for an unused index. The series is on Collection
 * and Transcendence nodes only.
 */
export const MASTERY_NODES: Readonly<
  Record<
    string,
    Readonly<
      Record<
        number,
        readonly (readonly [number, number, number, number?] | null)[]
      >
    >
  >
> = {
${characterBlocks.join("\n")}
};

/** limit_bonus key hash -> [limit_bonus.Key, ...limit_bonus_param keys of ParamId1-3]. */
export const MASTERY_BONUSES: Readonly<Record<number, readonly string[]>> = {
${bonusBlock.join("\n")}
};

/** limit_bonus_param.Key -> Lv1Value-Lv10Value as displayed, for the params mastery nodes use. */
export const MASTERY_PARAM_VALUES: Readonly<Record<string, readonly number[]>> = {
${paramBlock.join("\n")}
};`,
  );
  console.log(
    `MASTERY_NODES: ${nodeCount} nodes for ${nodes.size} characters, ${gaps} unused indices`,
  );
}
