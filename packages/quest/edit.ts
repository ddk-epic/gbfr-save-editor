import { SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  FATE_QUEST_CLEARED,
  STORY_CUTSCENE_CHECKPOINTS,
  STORY_CUTSCENE_CLEARS,
  STORY_CUTSCENE_IDS,
} from "./attributes";

export const STORY_CUTSCENE_CHECKPOINT_VALUES = 64;
const LOWEST_GRADE = 0;

/** Marks the fate quests at the listed rows as cleared. */
export function clearFateQuests(draft: Draft, rows: readonly number[]) {
  const cleared = [...draft.of(SAVE_ENTITY).get(FATE_QUEST_CLEARED)];
  for (const row of rows) cleared[row] = 1;
  draft.of(SAVE_ENTITY).set(FATE_QUEST_CLEARED, cleared);
}

/** Marks quest counter quests with no clears as cleared once, with no rewards, and returns those it changed. */
export function clearCounterQuests(
  draft: Draft,
  quests: readonly number[],
): number[] {
  const at = draft.of(SAVE_ENTITY);
  const ids = at.get(COUNTER_QUEST_IDS);
  const clears = [...at.get(COUNTER_QUEST_CLEARS)];
  const grades = [...at.get(COUNTER_QUEST_FLAGS)];
  const opened = [...at.get(COUNTER_QUEST_OPENED)];
  const cleared = [...at.get(COUNTER_QUEST_CLEARED)];
  const added: number[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || clears[row] !== 0) continue;
    clears[row] = 1;
    grades[row] = LOWEST_GRADE;
    opened[row] = true;
    cleared[row] = true;
    added.push(quest);
  }

  if (added.length === 0) return added;
  at.set(COUNTER_QUEST_CLEARS, clears);
  at.set(COUNTER_QUEST_FLAGS, grades);
  at.set(COUNTER_QUEST_OPENED, opened);
  at.set(COUNTER_QUEST_CLEARED, cleared);
  return added;
}

/** Lists quest counter quests, and returns those it changed. */
export function openCounterQuests(
  draft: Draft,
  quests: readonly number[],
): number[] {
  const at = draft.of(SAVE_ENTITY);
  const ids = at.get(COUNTER_QUEST_IDS);
  const opened = [...at.get(COUNTER_QUEST_OPENED)];
  const added: number[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || opened[row]) continue;
    opened[row] = true;
    added.push(quest);
  }

  if (added.length > 0) at.set(COUNTER_QUEST_OPENED, opened);
  return added;
}

/** Marks story cutscenes with no clears as played, and returns those it changed. */
export function clearStoryCutscenes(
  draft: Draft,
  quests: readonly number[],
): number[] {
  const at = draft.of(SAVE_ENTITY);
  const ids = at.get(STORY_CUTSCENE_IDS);
  const clears = [...at.get(STORY_CUTSCENE_CLEARS)];
  const checkpoints = [...at.get(STORY_CUTSCENE_CHECKPOINTS)];
  const added: number[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || clears[row] !== 0) continue;
    clears[row] = 1;
    checkpoints[row * STORY_CUTSCENE_CHECKPOINT_VALUES] = 0;
    added.push(quest);
  }

  if (added.length === 0) return added;
  at.set(STORY_CUTSCENE_CLEARS, clears);
  at.set(STORY_CUTSCENE_CHECKPOINTS, checkpoints);
  return added;
}
