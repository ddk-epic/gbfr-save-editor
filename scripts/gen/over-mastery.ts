import type { Context } from "./context";
import { loadLimitBonus } from "./limit-bonus";

export function genOverMastery(ctx: Context) {
  const { emit } = ctx;
  const { paramValues } = loadLimitBonus(ctx);
  // Over Mastery stats: the MED_EFF_* params, read at Lv<roll level>Value.
  const overMasteryBlock = [...paramValues]
    .filter(([param]) => param.startsWith("MED_EFF_"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([param, values]) =>
        `  ${JSON.stringify(param)}: ${JSON.stringify(values)},`,
    );
  emit(
    "over-mastery",
    `/** MED_EFF_* limit_bonus_param.Key -> Lv1Value-Lv10Value. */
export const OVER_MASTERY_VALUES: Readonly<Record<string, readonly number[]>> = {
${overMasteryBlock.join("\n")}
};`,
  );
}
