import type { UnitStore } from "../../core/unit-store";
import { PROFILE_FIRST, PROFILE_QUESTS_CLEARED } from "./attributes";

/** The player's own profile, in the same format as the online player list entry. */
export interface Profile {
  questsCleared: number;
}

export function readProfile(units: UnitStore): Profile {
  return {
    questsCleared: units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED),
  };
}
