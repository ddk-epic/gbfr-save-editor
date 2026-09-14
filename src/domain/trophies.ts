import type { UnitStore } from "../format/unit-store";
import { ID } from "./layout";

/**
 * `badge.Key` of every earned trophy, ascending. The game hides some unearned
 * trophies until an earlier one in their chain is earned; that is not stored.
 */
export function readEarnedTrophies(units: UnitStore): number[] {
  const earned = units.values(ID.TROPHY_EARNED, 0, "bool") ?? [];
  return earned.flatMap((flag, key) => (flag ? [key] : []));
}
