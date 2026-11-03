import { Attribute } from "../../core/attribute";

/** SystemData. */
export const SYSTEM_STORY_DIFFICULTY = Attribute.byte(817);

export const CURRENT_TOWN = Attribute.int(2502);
export const CURRENT_TOWN_CHECKPOINT = Attribute.uint(2503);
/** Solo, then online. */
export const CURRENT_CHAPTER = Attribute.intList(2506);
export const NO_CHAPTER = -1;

export const STORY_QUEST_IDS = Attribute.uintList(2510);
export const STORY_QUEST_CLEARED = Attribute.uintList(2511);
export const STORY_QUEST_LIVE_CLEARED = Attribute.uintList(2512);
export const STORY_QUEST_THIRD_CLEARED = Attribute.uintList(2522);
export const STORY_QUEST_CHECKPOINTS = Attribute.uintList(2513);
export const STORY_QUEST_CHECKPOINTS_LIVE = Attribute.uintList(2514);
export const STORY_QUEST_CHECKPOINT_COUNT = 200;

export const CHAPTER_KEYS = Attribute.intList(2590);
export const CHAPTER_BEST_DIFFICULTY = Attribute.intList(2591);
export const CHAPTER_ULTIMATE_CLEARED = Attribute.intList(2592);
export const CHAPTER_ULTIMATE_CLEARS = Attribute.intList(2594);
export const CHAPTER_GROUPS = Attribute.intList(2595);
export const CHAPTER_GROUP_FLAGS = Attribute.intList(2596);

export const ISLAND_KEY = Attribute.uint(6101);
export const ISLAND_UNLOCKED = Attribute.bool(6102);
