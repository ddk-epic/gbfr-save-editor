import { hashId } from "../../packages/core/xxhash32-custom";
import { UNNAMED_KEY, type Context } from "./context";
import { loadLimitBonus } from "./limit-bonus";

export function genConflux(ctx: Context) {
  const { db, emit } = ctx;
  const { bonusParams, paramValues } = loadLimitBonus(ctx);
  // Resonance tree: every endlessmode_tree row in table order. The save keeps one
  // 1602 bitmask per distinct bonus (Unk19, a limit_bonus key), and Unk24 is the
  // node's bit in it, as LimitBonusParamIndex is for masteries. A node's effect is
  // its bonus's limit_bonus_param values at that index.
  const treeRows = db
    .prepare(
      "select Unk19 as bonus, Unk24 as bit, Unk25 as cost from endlessmode_tree",
    )
    .all() as { bonus: string; bit: number; cost: number }[];
  const treeBlock = treeRows.map(({ bonus, bit, cost }) => {
    if (bit > 7)
      throw new Error(`endlessmode_tree ${bonus}: bit ${bit} past 7`);
    const hash = UNNAMED_KEY.test(bonus) ? parseInt(bonus, 16) : hashId(bonus);
    const effects = (bonusParams.get(bonus) ?? [])
      .filter((param) => paramValues.has(param))
      .map((param) => [param, paramValues.get(param)![bit]!]);
    return `  [0x${hash.toString(16).padStart(8, "0")}, ${JSON.stringify(bonus)}, ${bit}, ${cost}, ${JSON.stringify(effects)}],`;
  });

  // Aura collection: every endlessmode_buff row by KeyMaybe, the collection's sort
  // order. Unk105 is the key the save holds, Unk109 the category.
  const auraRows = db
    .prepare(
      "select Unk105 as key, Unk109 as category, KeyMaybe as sortOrder from endlessmode_buff order by KeyMaybe, Unk105",
    )
    .all() as { key: string; category: number; sortOrder: number }[];
  const auraBlock = auraRows.map(
    ({ key, category }) =>
      `  [0x${parseInt(key, 16).toString(16).padStart(8, "0")}, ${JSON.stringify(key)}, ${category}],`,
  );
  emit(
    "conflux",
    `/** endlessmode_tree rows in table order, ${treeRows.length} nodes: bonus hash, limit_bonus.Key,
 * the node's bit in the bonus's 1602 bitmask (Unk24), cost (Unk25), and the limit_bonus_param
 * effects with their value at that bit. */
export const CONFLUX_TREE: readonly (readonly [
  hash: number,
  bonus: string,
  bit: number,
  cost: number,
  effects: readonly (readonly [param: string, value: number])[],
])[] = [
${treeBlock.join("\n")}
];

/** endlessmode_buff rows in collection order (KeyMaybe), ${auraRows.length} auras: Unk105 hash, Unk105, category (Unk109). */
export const CONFLUX_AURAS: readonly (readonly [
  hash: number,
  key: string,
  category: number,
])[] = [
${auraBlock.join("\n")}
];`,
  );
  console.log(
    `CONFLUX_TREE: ${treeRows.length} nodes, CONFLUX_AURAS: ${auraRows.length} auras`,
  );
}
