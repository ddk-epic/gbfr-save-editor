import { Attribute } from "../../core/attribute";

/** Drawn at each quest start. */
export const QUEST_SEED = Attribute.uint(2504);
/** Chapter key underway, solo then online. */
export const CURRENT_CHAPTER = Attribute.intList(2506);

export const STORY_QUEST_IDS = Attribute.uintList(2510);

/** `chapter_select.Key` of each chapter reached. */
export const CHAPTER_KEYS = Attribute.intList(2590);
/** Marks the chapters chapter select offers. */
export const CHAPTER_FLAGS = Attribute.intList(2591);

export const SIDE_QUEST_IDS = Attribute.uintList(2550);
export const SIDE_QUEST_STATE = Attribute.uintList(2551);
export const SIDE_QUEST_ACCEPTED = Attribute.boolList(2555);

export const COUNTER_QUEST_IDS = Attribute.uintList(2570);
export const COUNTER_QUEST_CLEARS = Attribute.uintList(2571);
export const COUNTER_QUEST_FLAGS = Attribute.uintList(2574);
export const COUNTER_QUEST_LAST_CLEARED = Attribute.uintList(2579);

export const FATE_QUEST_IDS = Attribute.uintList(2560);
export const FATE_QUEST_CLEARED = Attribute.uintList(2561);
