import { TROPHIES, type TrophyTab } from "./data.gen";
import { type UnitStore, SAVE_ENTITY } from "@gbfr/core";
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

/** Every trophy in `TROPHIES`, in journal order, earned or not. */
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
  // An earned key the table does not hold.
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
