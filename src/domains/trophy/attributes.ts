import { Attribute } from "../../core/attribute";

export const TROPHY_EARNED = Attribute.boolList(5801);
export const TROPHY_SEEN = Attribute.boolList(5816);
export const TROPHY_PROGRESS = Attribute.longList(5815);

/** `TROPHY_PROGRESS` indexes. */
export const CHAPTER_KEYS_CLEARED = 2;
export const ARCHIVES_UNLOCKED_COUNTERS = [46, 47];
/** Clears of a difficulty sit at this plus the quest id's difficulty digit. */
export const QUEST_CLEARS_BEFORE_DIFFICULTY = 13;
export const QUESTS_CLEARED = 20;
export const RUPIES_EARNED = 224;
export const STORY_MASTERY_FILLED = 714;
export const TROPHIES_EARNED_OUTSIDE_RANGE = 501;
export const TROPHIES_EARNED_IN_RANGE = 1018;
/** `badge.Key` range counted by `TROPHIES_EARNED_IN_RANGE`. */
export const TROPHY_RANGE_FIRST = 1395;
export const TROPHY_RANGE_LAST = 1453;
