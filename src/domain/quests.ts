import { QUEST_COUNTER } from "../data/quests";
import type { UnitStore } from "../format/unit-store";
import { ID } from "./layout";

const QUEST_POSITIONS = new Map(QUEST_COUNTER.map(([id], i) => [id, i]));
const QUEST_POWERS = new Map(QUEST_COUNTER);

/** The quest counter's own order within a difficulty; unlisted quests last. */
export const questOrder = (id: string) => QUEST_POSITIONS.get(id) ?? Infinity;

/** PWR the counter advises for a quest, undefined for an id it never fills. */
export const questPower = (id: string) => QUEST_POWERS.get(id);

export interface SideQuest {
  /** Quest id as the quest_* tables spell it, 8 hex digits. */
  id: string;
  accepted: boolean;
  completed: boolean;
}
export const QUEST_DIFFICULTIES = [
  "easy",
  "normal",
  "hard",
  "very hard",
  "extreme",
  "maniac",
  "proud",
  "chaos",
  "chaos+",
  "chaos++",
  "infinity",
] as const;

export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

/** A best grade counter for quests; a quest never cleared holds 7. */
export const QUEST_GRADES = ["C", "B", "A", "S", "S+", "S++"] as const;

export type QuestGrade = (typeof QUEST_GRADES)[number];

export interface CounterQuest {
  /** Quest id as the quest_* tables spell it, 8 hex digits. */
  id: string;
  /** Difficulty from the id's fifth digit, 1 Easy to B Infinity. */
  difficulty: QuestDifficulty | undefined;
  clears: number;
  /** Best grade earned, undefined until the quest is cleared. */
  grade: QuestGrade | undefined;
  /** Recorded since 2.0.0, undefined before. */
  lastCleared: Date | undefined;
}

/** Quest ids are stored as the uint their hex digits spell. */
const questId = (id: number) => id.toString(16).toUpperCase().padStart(8, "0");

/** Side quests in save order, accepted or not. */
export function readSideQuests(units: UnitStore): SideQuest[] {
  const ids = units.values(ID.SIDE_QUEST_IDS, 0, "uint") ?? [];
  const states = units.values(ID.SIDE_QUEST_STATE, 0, "uint") ?? [];
  const accepted = units.values(ID.SIDE_QUEST_ACCEPTED, 0, "bool") ?? [];
  const quests: SideQuest[] = [];
  ids.forEach((id, i) => {
    if (!id) return;
    quests.push({
      id: questId(id),
      accepted: accepted[i] ?? false,
      completed: (states[i] ?? 0) > 0,
    });
  });
  return quests;
}

/** Quest counter quests in save order, including ids never cleared. */
export function readCounterQuests(units: UnitStore): CounterQuest[] {
  const ids = units.values(ID.COUNTER_QUEST_IDS, 0, "uint") ?? [];
  const clears = units.values(ID.COUNTER_QUEST_CLEARS, 0, "uint") ?? [];
  const flags = units.values(ID.COUNTER_QUEST_FLAGS, 0, "uint") ?? [];
  const times = units.values(ID.COUNTER_QUEST_LAST_CLEARED, 0, "uint") ?? [];
  const quests: CounterQuest[] = [];
  ids.forEach((id, i) => {
    if (!id) return;
    const time = times[i] ?? 0;
    const key = questId(id);
    const cleared = (clears[i] ?? 0) > 0;
    quests.push({
      id: key,
      difficulty: QUEST_DIFFICULTIES[parseInt(key[4]!, 16) - 1],
      clears: clears[i] ?? 0,
      grade: cleared ? QUEST_GRADES[flags[i] ?? -1] : undefined,
      lastCleared: time ? new Date(time * 1000) : undefined,
    });
  });
  return quests;
}
