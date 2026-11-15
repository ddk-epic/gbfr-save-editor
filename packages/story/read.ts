import { type Save, SAVE_ENTITY } from "@gbfr/core";
import { SYSTEM_STORY_DIFFICULTY } from "./attributes";

/** The difficulty the system data records for the story. */
export const storyDifficulty = (save: Save) =>
  save.systemData.units.of(SAVE_ENTITY).get(SYSTEM_STORY_DIFFICULTY);
