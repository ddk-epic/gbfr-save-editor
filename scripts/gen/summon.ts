import type { Context } from "./context";

export function genSummon({ db, emit }: Context) {
  // Summon equip bonuses: Level1Value-Level10Value times ValueDisplayMultiplier, 10 on Stun Power.
  const summonBonusBlock = (
    db.prepare(`select * from summon_base_param`).all() as Record<
      string,
      number | string
    >[]
  )
    .map((row): [string, number[]] => [
      row.Key as string,
      Array.from(
        { length: 10 },
        (_, i) =>
          Math.round(
            (row[`Level${i + 1}Value`] as number) *
              (row.ValueDisplayMultiplier as number) *
              1000,
          ) / 1000,
      ),
    ])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, values]) => `  ${JSON.stringify(key)}: ${JSON.stringify(values)},`,
    );
  emit(
    "summon",
    `/** summon_base_param.Key -> Level1Value-Level10Value. */
export const SUMMON_BONUS_VALUES: Readonly<Record<string, readonly number[]>> = {
${summonBonusBlock.join("\n")}
};`,
  );
}
