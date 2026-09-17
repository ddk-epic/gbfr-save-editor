import { TROPHIES, type TrophyTab } from "../data/trophies";
import type { UnitStore } from "../format/unit-store";
import { ID } from "./layout";

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
  viewed: boolean;
}

/**
 * Every trophy in `TROPHIES`, the order the journal lists, earned or not. The
 * game hides some unearned trophies until an earlier one in their chain is
 * earned; that is not stored.
 */
export function readTrophies(units: UnitStore): Trophy[] {
  const earned = new Set(
    (units.values(ID.TROPHY_EARNED, 0, "bool") ?? []).flatMap((flag, key) =>
      flag ? [key] : [],
    ),
  );
  const viewed = units.values(ID.TROPHY_VIEWED, 0, "bool") ?? [];
  const trophies: Trophy[] = TROPHIES.map(([key, tab, dlc, quantity]) => ({
    key,
    tab,
    dlc,
    quantity,
    earned: earned.delete(key),
    viewed: viewed[key] === true,
  }));
  // An earned key the table does not hold, after a game update.
  for (const key of earned)
    trophies.push({
      key,
      tab: "other",
      dlc: undefined,
      quantity: undefined,
      earned: true,
      viewed: viewed[key] === true,
    });
  return trophies;
}
