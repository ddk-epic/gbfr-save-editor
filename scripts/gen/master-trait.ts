import { hashId } from "../../packages/core/xxhash32-custom";
import { UNNAMED_KEY, type Context } from "./context";

export function genMasterTrait({ db, emit }: Context) {
  // Master trait cell by skillboard_effect key: [category, rank, board order, perk, position].
  // Ranks by skillboard_group key, in unlock order.
  const RANKS: Record<string, string> = {
    "68DE92AC": "r1",
    A96D9EBC: "r2",
    "4A5DDC7B": "r3",
    "3B99904D": "ex",
  };
  const layout = db
    .prepare(
      "select SkillboardEffectOrUiId as effect, CharacterId as chara, SkillboardCategoryId as category, SkillboardGroupId as grp, Unk25 as weight, Unk30 as board_order from skillboard_layout order by Unk30",
    )
    .all() as {
    effect: string;
    chara: string;
    category: string;
    grp: string;
    weight: number;
    board_order: number;
  }[];
  // Position: 1-based among the non-perk cells of one board's category and rank, in Unk30 order.
  const boardCounts = new Map<string, number>();
  const cells = layout.map(
    ({ effect, chara, category, grp, weight, board_order }) => {
      const rank = RANKS[grp];
      if (!rank) throw new Error(`skillboard_layout: unknown group ${grp}`);
      // Unk25 is 100 on the three perk cells of a style and 50 elsewhere.
      const perk = weight === 100;
      const cell: (string | number | boolean)[] = [
        category,
        rank,
        board_order,
        perk,
      ];
      if (!perk) {
        const board = `${chara} ${category} ${grp}`;
        const position = (boardCounts.get(board) ?? 0) + 1;
        boardCounts.set(board, position);
        cell.push(position);
      }
      const hash = UNNAMED_KEY.test(effect)
        ? parseInt(effect, 16)
        : hashId(effect);
      return `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify(cell)},`;
    },
  );

  // {n} in a trait's text is Value(n % 10 + 1) of action part n / 10.
  const actionParts = db
    .prepare("select * from skillboard_effect_action_parts")
    .all() as Record<string, unknown>[];
  const partValues = new Map(
    actionParts.map((part) => [
      part.Key as string,
      Array.from(
        { length: 10 },
        (_, i) => Math.round((part[`Value${i + 1}`] as number) * 1000) / 1000,
      ),
    ]),
  );
  // Stun Power, SubType 8 with MainType 8, is stored at 1/10 of what the game shows.
  const partScales = new Map(
    actionParts.map((part) => [
      part.Key as string,
      part.SubType === 8 && part.MainType === 8 ? 10 : 1,
    ]),
  );
  const traitValues: string[] = [];
  const traitScales: string[] = [];
  for (const effect of db
    .prepare(
      "select Key, SkillboardEffectActionPartsId1 as p1, SkillboardEffectActionPartsId2 as p2, SkillboardEffectActionPartsId3 as p3 from skillboard_effect order by Key",
    )
    .all() as { Key: string; p1: string; p2: string; p3: string }[]) {
    const parts = [effect.p1, effect.p2, effect.p3];
    const values = parts.flatMap((part) => {
      if (!part) return Array<number>(10).fill(0);
      const found = partValues.get(part);
      if (!found)
        throw new Error(
          `skillboard_effect ${effect.Key}: no action part ${part}`,
        );
      return found;
    });
    const scales = parts.flatMap((part) =>
      Array<number>(10).fill(part ? partScales.get(part)! : 1),
    );
    while (values.at(-1) === 0) values.pop();
    while (scales.at(-1) === 1) scales.pop();
    if (values.length)
      traitValues.push(
        `  ${JSON.stringify(effect.Key)}: [${values.join(", ")}],`,
      );
    if (scales.length)
      traitScales.push(
        `  ${JSON.stringify(effect.Key)}: [${scales.join(", ")}],`,
      );
  }
  emit(
    "master-trait",
    `/**
 * skillboard_layout by skillboard_effect key hash, ${cells.length} cells: [category, rank,
 * board order (Unk30), perk, position]. Position is 1-based among the non-perk cells of
 * the board's category and rank in Unk30 order, absent on perks.
 */
export const SKILLBOARD_CELLS: Readonly<
  Record<
    number,
    readonly [string, "r1" | "r2" | "r3" | "ex", number, boolean, number?]
  >
> = {
${cells.sort().join("\n")}
};

/** skillboard_effect.Key -> Value1-10 of action parts 1-3 as stored, flat, for {0}-{29} in its text. */
export const MASTER_TRAIT_VALUES: Readonly<Record<string, readonly number[]>> = {
${traitValues.join("\n")}
};

/** skillboard_effect.Key -> what a stored value is multiplied by to display it, 1 past the list. */
export const MASTER_TRAIT_VALUE_SCALES: Readonly<
  Record<string, readonly number[]>
> = {
${traitScales.join("\n")}
};`,
  );
  console.log(
    `SKILLBOARD_CELLS: ${cells.length} cells, MASTER_TRAIT_VALUES: ${traitValues.length}, scaled ${traitScales.length}`,
  );
}
