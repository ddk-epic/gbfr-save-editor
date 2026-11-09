import { Attribute } from "@gbfr/core";

export const SIDE_QUEST_IDS = Attribute.uintList(2550);
export const SIDE_QUEST_STATE = Attribute.uintList(2551);
export const SIDE_QUEST_ACCEPTED = Attribute.boolList(2555);
export const SIDE_QUEST_CHECKPOINTS = Attribute.uintList(2552);
export const SIDE_QUEST_PROGRESS = Attribute.uintList(2553);
export const SIDE_QUESTS_TAKEN = Attribute.uintList(2505);

export const COUNTER_QUEST_IDS = Attribute.uintList(2570);
export const COUNTER_QUEST_CLEARS = Attribute.uintList(2571);
export const COUNTER_QUEST_FLAGS = Attribute.uintList(2574);
export const COUNTER_QUEST_OPENED = Attribute.boolList(2575);
export const COUNTER_QUEST_CLEARED = Attribute.boolList(2576);
export const COUNTER_QUEST_LAST_CLEARED = Attribute.uintList(2579);

export const STORY_CUTSCENE_IDS = Attribute.uintList(2580);
export const STORY_CUTSCENE_CLEARS = Attribute.uintList(2581);
export const STORY_CUTSCENE_CHECKPOINTS = Attribute.uintList(2582);

export const QUEST_DIFFICULTY_UNLOCKED = Attribute.int(7303);
export const QUEST_RANK_REWARDED = Attribute.int(2508);

export const FATE_QUEST_IDS = Attribute.uintList(2560);
export const FATE_QUEST_CLEARED = Attribute.uintList(2561);
