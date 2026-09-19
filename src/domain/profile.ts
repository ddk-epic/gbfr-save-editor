import type { UnitStore } from "../core/unit-store";
import { PROFILE_QUESTS_CLEARED, UNIT } from "./layout";

/** The player's own profile, in the same format as the online player list entry. */
export interface Profile {
  questsCleared: number;
}

export function readProfile(units: UnitStore): Profile {
  return {
    questsCleared: units.of(UNIT.PROFILE).get(PROFILE_QUESTS_CLEARED),
  };
}
