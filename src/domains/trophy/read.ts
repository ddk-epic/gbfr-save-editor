import { TROPHIES, type TrophyTab } from "../../data/trophies";
import type { UnitStore } from "../../core/unit-store";
import { SAVE_ENTITY } from "../user/attributes";
import { TROPHY_EARNED, TROPHY_SEEN } from "./attributes";

export interface Trophy {
  /** `badge.Key`. */
  key: number;
  tab: TrophyTab;
  /** `badge.IsEndlessRagnarok`, undefined for a key the table lacks. */
  dlc: boolean | undefined;
  /** `badge.ReqQuantity`, the {0} of descriptions that have one. */
  quantity: number | undefined;
  earned: boolean;
  /** New mark cleared, only ever on earned trophies. */
  seen: boolean;
}

/**
 * Every trophy in `TROPHIES`, the order the journal lists, earned or not. The
 * game hides some unearned trophies until an earlier one in their chain is
 * earned; that is not stored.
 */
export function readTrophies(units: UnitStore): Trophy[] {
  const at = units.of(SAVE_ENTITY);
  const earned = new Set(
    at.get(TROPHY_EARNED).flatMap((flag, key) => (flag ? [key] : [])),
  );
  const seen = at.get(TROPHY_SEEN);
  const trophies: Trophy[] = TROPHIES.map(([key, tab, dlc, quantity]) => ({
    key,
    tab,
    dlc,
    quantity,
    earned: earned.delete(key),
    seen: seen[key] === true,
  }));
  // An earned key the table does not hold, after a game update.
  for (const key of earned)
    trophies.push({
      key,
      tab: "other",
      dlc: undefined,
      quantity: undefined,
      earned: true,
      seen: seen[key] === true,
    });
  return trophies;
}
