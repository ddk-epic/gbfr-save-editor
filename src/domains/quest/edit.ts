import type { UnitStore } from "../../core/unit-store";
import type { Patch } from "../../core/session";
import { SAVE_ENTITY } from "../../core/save-entity";
import { FATE_QUEST_CLEARED } from "./attributes";

/** Marks the fate quests at the listed rows as cleared. */
export function clearFateQuests(
  units: UnitStore,
  rows: readonly number[],
): Patch {
  const cleared = [...units.of(SAVE_ENTITY).get(FATE_QUEST_CLEARED)];
  for (const row of rows) cleared[row] = 1;
  return units.of(SAVE_ENTITY).patch(FATE_QUEST_CLEARED, cleared);
}
