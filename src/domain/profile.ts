import type { UnitStore } from "../format/unit-store";
import { ID, UNIT } from "./layout";

/** The player's own profile, in the same format as the online player list entry. */
export interface Profile {
  questsCleared: number;
}

export function readProfile(units: UnitStore): Profile {
  return {
    questsCleared:
      units.values(ID.PROFILE_QUESTS_CLEARED, UNIT.PROFILE, "int")?.[0] ?? 0,
  };
}
