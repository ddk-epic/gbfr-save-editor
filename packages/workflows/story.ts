import { type Attribute, SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  CONFLUX_CYCLE_CLEARED,
  CONFLUX_RETURNED,
  CONFLUX_RETURNED_AT,
} from "@gbfr/conflux";
import { countQuestsCleared } from "@gbfr/profile/edit";
import {
  COUNTER_QUEST_IDS,
  QUEST_DIFFICULTY_UNLOCKED,
  QUEST_RANK_REWARDED,
  SIDE_QUEST_ACCEPTED,
  SIDE_QUEST_CHECKPOINTS,
  SIDE_QUEST_IDS,
  SIDE_QUEST_PROGRESS,
  SIDE_QUEST_STATE,
  SIDE_QUESTS_TAKEN,
  STORY_CUTSCENE_CHECKPOINTS,
  STORY_CUTSCENE_IDS,
  STORY_CUTSCENE_CLEARS,
} from "@gbfr/quest";
import {
  STORY_CUTSCENE_CHECKPOINT_VALUES,
  clearCounterQuests as clearCounterQuestRows,
  clearStoryCutscenes as clearStoryCutsceneRows,
  openCounterQuests,
} from "@gbfr/quest/edit";
import {
  BETWEEN_STORY_QUESTS,
  CHAPTER_BEST_DIFFICULTY,
  CHAPTER_GROUP_FLAGS,
  CHAPTER_GROUPS,
  CHAPTER_KEYS,
  CHAPTER_ULTIMATE_CLEARED,
  CHAPTER_ULTIMATE_CLEARS,
  CURRENT_CHAPTER,
  CURRENT_TOWN,
  CURRENT_TOWN_CHECKPOINT,
  ISLAND_KEY,
  ISLAND_UNLOCKED,
  isChapterCheckpoint,
  isReached,
  LAST_TOWN,
  listedQuests,
  STORY_CHECKPOINTS,
  STORY_QUEST_CHECKPOINT_COUNT,
  STORY_QUEST_CHECKPOINTS,
  STORY_QUEST_CHECKPOINTS_LIVE,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  STORY_QUEST_LIVE_CLEARED,
  STORY_QUEST_THIRD_CLEARED,
  storyPosition,
  type ChapterCheckpoint,
  type ProgressCheckpoint,
} from "@gbfr/story";
import { giveSummon } from "@gbfr/summon/edit";
import { countQuestClears } from "@gbfr/trophy/edit";
import { LOCATION_SPOT, LOCATION_STAGE } from "@gbfr/user";

const SIDE_QUEST_CHECKPOINT_VALUES = 64;
const SIDE_QUEST_PROGRESS_VALUES = 32;
const SIDE_QUEST_COMPLETED = 1;

/** Moves a new save, or one at a checkpoint, forward to checkpoint `id`. */
export function advanceStory(
  draft: Draft,
  id: string,
  storyDifficulty: number,
  now = Date.now(),
) {
  const position = storyPosition(draft);
  if (position === undefined)
    throw new Error("the save is not new or at a story checkpoint");
  const target = STORY_CHECKPOINTS.findIndex(
    (checkpoint) => checkpoint.id === id,
  );
  if (target === -1) throw new Error(`no story checkpoint ${id}`);
  if (target <= position)
    throw new Error(`the save is already at or past ${id}`);

  const chapters = STORY_CHECKPOINTS.slice(position + 1, target + 1).filter(
    isChapterCheckpoint,
  );
  if (chapters.length > 0) advanceChapters(draft, chapters, storyDifficulty);
  const at = draft.of(SAVE_ENTITY);
  for (let index = position + 1; index <= target; index++) {
    const checkpoint = STORY_CHECKPOINTS[index]!;
    if (!isChapterCheckpoint(checkpoint) && !isReached(at, index))
      advanceProgress(draft, checkpoint, storyDifficulty, now);
  }
}

function advanceChapters(
  draft: Draft,
  steps: readonly ChapterCheckpoint[],
  storyDifficulty: number,
) {
  const destination = steps[steps.length - 1]!;
  const at = draft.of(SAVE_ENTITY);

  const questIds = at.get(STORY_QUEST_IDS);
  const recordOf = (quest: number) => {
    const record = questIds.indexOf(quest);
    if (record === -1) throw new Error(`no story quest ${quest.toString(16)}`);
    return record;
  };

  const cleared = steps.flatMap((step) => step.cleared).map(recordOf);
  for (const attribute of [
    STORY_QUEST_CLEARED,
    STORY_QUEST_LIVE_CLEARED,
    STORY_QUEST_THIRD_CLEARED,
  ]) {
    const flags = [...at.get(attribute)];
    for (const record of cleared) flags[record] = 1;
    at.set(attribute, flags);
  }

  const begun = recordOf(destination.quest) * STORY_QUEST_CHECKPOINT_COUNT;
  for (const attribute of [
    STORY_QUEST_CHECKPOINTS,
    STORY_QUEST_CHECKPOINTS_LIVE,
  ]) {
    const sections = [...at.get(attribute)];
    for (const record of cleared)
      sections.fill(
        0,
        record * STORY_QUEST_CHECKPOINT_COUNT,
        (record + 1) * STORY_QUEST_CHECKPOINT_COUNT,
      );
    sections[begun] = destination.entrySection;
    at.set(attribute, sections);
  }

  const difficulty = Math.max(
    ...steps.map((step) => step.questDifficulty ?? 0),
  );
  if (difficulty > at.get(QUEST_DIFFICULTY_UNLOCKED))
    at.set(QUEST_DIFFICULTY_UNLOCKED, difficulty);
  if (difficulty - 1 > at.get(QUEST_RANK_REWARDED))
    at.set(QUEST_RANK_REWARDED, difficulty - 1);

  at.set(CURRENT_TOWN, destination.town);
  at.set(CURRENT_TOWN_CHECKPOINT, destination.townCheckpoint);
  at.set(CURRENT_CHAPTER, [destination.key, at.get(CURRENT_CHAPTER)[1]!]);

  for (const step of steps)
    for (const hash of step.islands)
      draft
        .of(draft.onlyEntityWhere(ISLAND_KEY, hash))
        .set(ISLAND_UNLOCKED, true);

  const chapterKeys = steps.flatMap((step) => step.chapterKeys);
  const chapterGroups = steps.flatMap((step) => step.chapterGroups);
  extendList(draft, CHAPTER_KEYS, chapterKeys);
  extendList(
    draft,
    CHAPTER_BEST_DIFFICULTY,
    chapterKeys.map(() => storyDifficulty),
  );
  for (const attribute of [CHAPTER_ULTIMATE_CLEARED, CHAPTER_ULTIMATE_CLEARS])
    extendList(
      draft,
      attribute,
      chapterKeys.map(() => 0),
    );
  extendList(draft, CHAPTER_GROUPS, chapterGroups);
  extendList(
    draft,
    CHAPTER_GROUP_FLAGS,
    chapterGroups.map(() => 0),
  );
}

/** Appends `values` to a list on the save entity. */
function extendList(
  draft: Draft,
  attribute: Attribute<number[]>,
  values: readonly number[],
) {
  const at = draft.of(SAVE_ENTITY);
  at.set(attribute, [...at.get(attribute), ...values]);
}

function advanceProgress(
  draft: Draft,
  checkpoint: ProgressCheckpoint,
  storyDifficulty: number,
  now: number,
) {
  const at = draft.of(SAVE_ENTITY);
  const difficulty = checkpoint.questDifficulty ?? 0;
  if (difficulty > at.get(QUEST_DIFFICULTY_UNLOCKED))
    at.set(QUEST_DIFFICULTY_UNLOCKED, difficulty);
  const rank = checkpoint.questRank ?? difficulty - 1;
  if (rank > at.get(QUEST_RANK_REWARDED)) at.set(QUEST_RANK_REWARDED, rank);
  clearStoryCutscenes(draft, checkpoint.storyCutscenes ?? []);
  clearCounterQuests(draft, checkpoint.counterQuests ?? []);
  openCounterQuests(draft, [
    ...listedQuests(at.get(COUNTER_QUEST_IDS), checkpoint),
    ...(checkpoint.openedQuests ?? []),
  ]);
  advanceStoryQuests(draft, checkpoint, storyDifficulty);
  for (const summon of checkpoint.summons ?? []) giveSummon(draft, summon);

  if (checkpoint.storyCutsceneSections) {
    const ids = at.get(STORY_CUTSCENE_IDS);
    const clears = at.get(STORY_CUTSCENE_CLEARS);
    const sections = [...at.get(STORY_CUTSCENE_CHECKPOINTS)];
    for (const [quest, hash] of checkpoint.storyCutsceneSections) {
      const row = ids.indexOf(quest);
      const first = row * STORY_CUTSCENE_CHECKPOINT_VALUES;
      if (row === -1 || clears[row] !== 0) continue;
      if (hash !== 0 && sections[first] !== 0) continue;
      sections[first] = hash;
    }
    at.set(STORY_CUTSCENE_CHECKPOINTS, sections);
  }

  if (checkpoint.sideQuests || checkpoint.sideQuestSections) {
    const taken = [...at.get(SIDE_QUESTS_TAKEN)];
    const takenBefore = taken.length;
    const ids = at.get(SIDE_QUEST_IDS);
    const states = [...at.get(SIDE_QUEST_STATE)];
    const accepted = [...at.get(SIDE_QUEST_ACCEPTED)];
    const sections = [...at.get(SIDE_QUEST_CHECKPOINTS)];
    const progress = [...at.get(SIDE_QUEST_PROGRESS)];
    for (const quest of checkpoint.sideQuests ?? []) {
      const row = ids.indexOf(quest);
      if (row === -1 || states[row] !== 0) continue;
      states[row] = SIDE_QUEST_COMPLETED;
      accepted[row] = true;
      sections[row * SIDE_QUEST_CHECKPOINT_VALUES] = 0;
      progress[row * SIDE_QUEST_PROGRESS_VALUES] = 0;
      if (!taken.includes(quest)) taken.push(quest);
    }
    for (const [quest, hash] of checkpoint.sideQuestSections ?? []) {
      const row = ids.indexOf(quest);
      const first = row * SIDE_QUEST_CHECKPOINT_VALUES;
      if (row === -1 || states[row] !== 0 || sections[first] !== 0) continue;
      sections[first] = hash;
    }
    at.set(SIDE_QUEST_STATE, states);
    at.set(SIDE_QUEST_ACCEPTED, accepted);
    at.set(SIDE_QUEST_CHECKPOINTS, sections);
    at.set(SIDE_QUEST_PROGRESS, progress);
    if (taken.length !== takenBefore) at.set(SIDE_QUESTS_TAKEN, taken);
  }

  if (checkpoint.confluxCycles !== undefined) {
    const cleared = [...at.get(CONFLUX_CYCLE_CLEARED)];
    const returned = [...at.get(CONFLUX_RETURNED)];
    const returnedAt = [...at.get(CONFLUX_RETURNED_AT)];
    for (let run = 0; run < checkpoint.confluxCycles; run++) {
      if (cleared[run] !== 0) continue;
      cleared[run] = 1;
      returned[run] = true;
      returnedAt[run] = Math.floor(now / 1000);
    }
    at.set(CONFLUX_CYCLE_CLEARED, cleared);
    at.set(CONFLUX_RETURNED, returned);
    at.set(CONFLUX_RETURNED_AT, returnedAt);
  }

  if (checkpoint.location) {
    const { town, townCheckpoint, spot } = checkpoint.location;
    at.set(CURRENT_TOWN, town);
    at.set(CURRENT_TOWN_CHECKPOINT, townCheckpoint);
    at.set(LAST_TOWN, town);
    at.set(LOCATION_STAGE, town);
    at.set(LOCATION_SPOT, spot);
  }
}

/** Clears the step's story quests, adds its chapter keys and sets 2506. */
function advanceStoryQuests(
  draft: Draft,
  checkpoint: ProgressCheckpoint,
  storyDifficulty: number,
) {
  const at = draft.of(SAVE_ENTITY);
  if (checkpoint.storyQuests) {
    const ids = at.get(STORY_QUEST_IDS);
    const records = checkpoint.storyQuests
      .map((quest) => ids.indexOf(quest))
      .filter((record) => record !== -1);
    for (const attribute of [STORY_QUEST_CLEARED, STORY_QUEST_THIRD_CLEARED]) {
      const flags = [...at.get(attribute)];
      for (const record of records) flags[record] = 1;
      at.set(attribute, flags);
    }
    for (const attribute of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      const sections = [...at.get(attribute)];
      for (const record of records)
        sections.fill(
          0,
          record * STORY_QUEST_CHECKPOINT_COUNT,
          (record + 1) * STORY_QUEST_CHECKPOINT_COUNT,
        );
      at.set(attribute, sections);
    }
    at.set(
      STORY_QUEST_LIVE_CLEARED,
      at.get(STORY_QUEST_LIVE_CLEARED).map(() => 0),
    );
    at.set(BETWEEN_STORY_QUESTS, 1);
  }
  if (checkpoint.begunQuest) {
    const { quest, section } = checkpoint.begunQuest;
    const record = at.get(STORY_QUEST_IDS).indexOf(quest);
    if (record === -1) throw new Error(`no story quest ${quest.toString(16)}`);
    for (const attribute of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      const sections = [...at.get(attribute)];
      sections[record * STORY_QUEST_CHECKPOINT_COUNT] = section;
      at.set(attribute, sections);
    }
    at.set(STORY_QUEST_LIVE_CLEARED, [...at.get(STORY_QUEST_CLEARED)]);
    at.set(BETWEEN_STORY_QUESTS, 0);
  }
  if (
    checkpoint.chapter !== undefined &&
    checkpoint.chapter > at.get(CURRENT_CHAPTER)[0]!
  )
    at.set(CURRENT_CHAPTER, [checkpoint.chapter, at.get(CURRENT_CHAPTER)[1]!]);

  if (checkpoint.chapterGroups) {
    const groups = at.get(CHAPTER_GROUPS);
    const added = checkpoint.chapterGroups.filter(
      ([group]) => !groups.includes(group),
    );
    if (added.length > 0) {
      extendList(
        draft,
        CHAPTER_GROUPS,
        added.map(([group]) => group),
      );
      extendList(
        draft,
        CHAPTER_GROUP_FLAGS,
        added.map(([, flag]) => flag),
      );
    }
  }

  const held = at.get(CHAPTER_KEYS);
  const added = (checkpoint.chapterKeys ?? []).filter(
    (key) => !held.includes(key),
  );
  if (added.length === 0) return;
  extendList(draft, CHAPTER_KEYS, added);
  extendList(
    draft,
    CHAPTER_BEST_DIFFICULTY,
    added.map(() => storyDifficulty),
  );
  for (const attribute of [CHAPTER_ULTIMATE_CLEARED, CHAPTER_ULTIMATE_CLEARS])
    extendList(
      draft,
      attribute,
      added.map(() => 0),
    );
}

/** Marks quest counter quests with no clears as cleared once, with no rewards, and returns those it changed. */
export function clearCounterQuests(
  draft: Draft,
  quests: readonly number[],
): string[] {
  const cleared = clearCounterQuestRows(draft, quests);
  countQuestClears(draft, cleared);
  countQuestsCleared(draft, cleared.length);
  return cleared.map((quest) => `counter quest ${quest.toString(16)}`);
}

/** Marks story cutscenes with no clears as played, and returns those it changed. */
export function clearStoryCutscenes(
  draft: Draft,
  quests: readonly number[],
): string[] {
  return clearStoryCutsceneRows(draft, quests).map(
    (quest) => `story cutscene ${quest.toString(16)}`,
  );
}
