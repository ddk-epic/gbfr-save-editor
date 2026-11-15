import { SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { FATE_QUEST_CLEARED } from "./attributes";

/** Marks the fate quests at the listed rows as cleared. */
export function clearFateQuests(draft: Draft, rows: readonly number[]) {
  const cleared = [...draft.of(SAVE_ENTITY).get(FATE_QUEST_CLEARED)];
  for (const row of rows) cleared[row] = 1;
  draft.of(SAVE_ENTITY).set(FATE_QUEST_CLEARED, cleared);
}
