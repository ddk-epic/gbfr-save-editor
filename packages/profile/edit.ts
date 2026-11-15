import type { Draft } from "@gbfr/core/draft";
import { PROFILE_FIRST, PROFILE_QUESTS_CLEARED } from "./attributes";

/** Adds `count` to the profile's quests cleared. */
export function countQuestsCleared(draft: Draft, count: number) {
  if (count === 0) return;
  const profile = draft.of(PROFILE_FIRST);
  profile.set(
    PROFILE_QUESTS_CLEARED,
    profile.get(PROFILE_QUESTS_CLEARED) + count,
  );
}
