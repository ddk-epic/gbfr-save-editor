import { SaveFormatError } from "../../core/errors";
import type { EntityRange, UnitStore } from "../../core/unit-store";
import {
  OVER_MASTERY_KEY,
  OVER_MASTERY_LEVEL,
  OVER_MASTERY_LINES,
} from "./attributes";

export interface OverMastery {
  /** limit_bonus_param.Key, MED_EFF_* */
  key: string;
  /** Roll level 1-10. */
  level: number;
}

export function readOverMasteries(
  units: UnitStore,
  mastery: EntityRange,
): (OverMastery | undefined)[] {
  return Array.from({ length: OVER_MASTERY_LINES }, (_, i) => {
    const entity = mastery.first + i;
    const at = units.of(entity);
    const key = at.get(OVER_MASTERY_KEY);
    if (key === undefined) return undefined;
    // The level is stored as one bit: level n is 1 << (n - 1).
    const bits = at.get(OVER_MASTERY_LEVEL);
    const level = Math.log2(bits) + 1;
    if (!Number.isInteger(level))
      throw new SaveFormatError({ code: "overMasteryLevel", entity, bits });
    return { key, level };
  });
}
