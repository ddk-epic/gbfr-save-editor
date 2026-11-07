import type { SaveSession } from "../../core/session";
import { PROFILE_FIRST, PROFILE_QUESTS_CLEARED } from "../profile/attributes";
import {
  PROUD_QUEST_CLEARS,
  QUEST_CLEARS_BEFORE_DIFFICULTY,
  QUESTS_CLEARED,
  TROPHY_PROGRESS,
} from "../trophy/attributes";
import { SAVE_ENTITY } from "../../core/save-entity";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  SHORT_STORY_CHECKPOINTS,
  SHORT_STORY_CLEARS,
  SHORT_STORY_IDS,
} from "./attributes";
import { difficultyDigit } from "./read";

const LOWEST_GRADE = 0;
const SHORT_STORY_CHECKPOINT_VALUES = 64;

/** Marks quest counter quests with no clears as cleared once, with no rewards, and returns those it changed. */
export function clearCounterQuests(
  session: SaveSession,
  quests: readonly number[],
): string[] {
  const units = session.save.slotData.units;
  const at = units.of(SAVE_ENTITY);
  const ids = at.get(COUNTER_QUEST_IDS);
  const clears = [...at.get(COUNTER_QUEST_CLEARS)];
  const grades = [...at.get(COUNTER_QUEST_FLAGS)];
  const opened = [...at.get(COUNTER_QUEST_OPENED)];
  const cleared = [...at.get(COUNTER_QUEST_CLEARED)];
  const progress = [...at.get(TROPHY_PROGRESS)];
  let questsCleared = units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED);
  const added: string[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || clears[row] !== 0) continue;
    clears[row] = 1;
    grades[row] = LOWEST_GRADE;
    opened[row] = true;
    cleared[row] = true;
    questsCleared++;
    const digit = (quest >> 12) & 0xf;
    const difficulty =
      digit === difficultyDigit("proud")
        ? PROUD_QUEST_CLEARS
        : QUEST_CLEARS_BEFORE_DIFFICULTY + digit;
    progress[difficulty] = progress[difficulty]! + 1n;
    progress[QUESTS_CLEARED] = progress[QUESTS_CLEARED]! + 1n;
    added.push(`counter quest ${quest.toString(16)}`);
  }

  if (added.length === 0) return added;
  session.patch([
    at.patch(COUNTER_QUEST_CLEARS, clears),
    at.patch(COUNTER_QUEST_FLAGS, grades),
    at.patch(COUNTER_QUEST_OPENED, opened),
    at.patch(COUNTER_QUEST_CLEARED, cleared),
    at.patch(TROPHY_PROGRESS, progress),
    units.of(PROFILE_FIRST).patch(PROFILE_QUESTS_CLEARED, questsCleared),
  ]);
  return added;
}

/** Lists quest counter quests, and returns those it changed. */
export function openCounterQuests(
  session: SaveSession,
  quests: readonly number[],
): string[] {
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  const ids = at.get(COUNTER_QUEST_IDS);
  const opened = [...at.get(COUNTER_QUEST_OPENED)];
  const added: string[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || opened[row]) continue;
    opened[row] = true;
    added.push(`listed counter quest ${quest.toString(16)}`);
  }

  if (added.length > 0) session.patch([at.patch(COUNTER_QUEST_OPENED, opened)]);
  return added;
}

/** Marks short stories with no clears as played, and returns those it changed. */
export function clearShortStories(
  session: SaveSession,
  quests: readonly number[],
): string[] {
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  const ids = at.get(SHORT_STORY_IDS);
  const clears = [...at.get(SHORT_STORY_CLEARS)];
  const checkpoints = [...at.get(SHORT_STORY_CHECKPOINTS)];
  const added: string[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || clears[row] !== 0) continue;
    clears[row] = 1;
    checkpoints[row * SHORT_STORY_CHECKPOINT_VALUES] = 0;
    added.push(`short story ${quest.toString(16)}`);
  }

  if (added.length === 0) return added;
  session.patch([
    at.patch(SHORT_STORY_CLEARS, clears),
    at.patch(SHORT_STORY_CHECKPOINTS, checkpoints),
  ]);
  return added;
}
