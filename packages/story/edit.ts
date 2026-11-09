import { type Attribute, type Save, SAVE_ENTITY } from "@gbfr/core";
import type { Patch, SaveSession } from "@gbfr/core/session";
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
  LAST_TOWN,
  ISLAND_UNLOCKED,
  NO_CHAPTER,
  STORY_QUEST_CHECKPOINT_COUNT,
  STORY_QUEST_CHECKPOINTS,
  STORY_QUEST_CHECKPOINTS_LIVE,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  STORY_QUEST_LIVE_CLEARED,
  STORY_QUEST_THIRD_CLEARED,
  SYSTEM_STORY_DIFFICULTY,
} from "./attributes";
import {
  type ChapterCheckpoint,
  isChapterCheckpoint,
  type ProgressCheckpoint,
  STORY_CHECKPOINTS,
  CHAPTER_ZERO_END_KEY,
  type StoryCheckpoint,
} from "./checkpoints";
import {
  CONFLUX_CYCLE_CLEARED,
  CONFLUX_RETURNED,
  CONFLUX_RETURNED_AT,
} from "@gbfr/conflux";
import { PROFILE_FIRST, PROFILE_QUESTS_CLEARED } from "@gbfr/profile";
import {
  CHAOS_QUEST_CLEARS,
  PROUD_QUEST_CLEARS,
  QUEST_CLEARS_BEFORE_DIFFICULTY,
  QUESTS_CLEARED,
  TROPHY_PROGRESS,
} from "@gbfr/trophy";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  QUEST_RANK_REWARDED,
  QUEST_DIFFICULTY_UNLOCKED,
  STORY_CUTSCENE_CHECKPOINTS,
  STORY_CUTSCENE_CLEARS,
  STORY_CUTSCENE_IDS,
  SIDE_QUEST_ACCEPTED,
  SIDE_QUEST_CHECKPOINTS,
  SIDE_QUEST_IDS,
  SIDE_QUEST_PROGRESS,
  SIDE_QUEST_STATE,
  SIDE_QUESTS_TAKEN,
  difficultyDigit,
} from "@gbfr/quest";
import { LOCATION_SPOT, LOCATION_STAGE } from "@gbfr/user";
import { giveSummon } from "@gbfr/summon/edit";

type SlotUnit = ReturnType<Save["slotData"]["units"]["of"]>;

const CHAPTER_ZERO_END_ID = "chapterZeroEnd";
const SIDE_QUEST_CHECKPOINT_VALUES = 64;
const SIDE_QUEST_PROGRESS_VALUES = 32;
const STORY_CUTSCENE_CHECKPOINT_VALUES = 64;
const SIDE_QUEST_COMPLETED = 1;

/** The checkpoints a save can advance to, in story order. */
export function storyTargets(save: Save): readonly StoryCheckpoint[] {
  const position = storyPosition(save);
  return position === undefined ? [] : STORY_CHECKPOINTS.slice(position + 1);
}

/** Each checkpoint, completed once the save reaches the next one. */
export function storyProgress(
  save: Save,
): readonly { checkpoint: StoryCheckpoint; completed: boolean }[] {
  const position = storyPosition(save) ?? chapterFloor(save);
  return STORY_CHECKPOINTS.map((checkpoint, index) => ({
    checkpoint,
    completed: index < position,
  }));
}

/** Index of the last checkpoint the save has reached, -1 on a new save, undefined anywhere else. */
export function storyPosition(save: Save): number | undefined {
  const at = save.slotData.units.of(SAVE_ENTITY);
  const chapter = at.get(CURRENT_CHAPTER)[0]!;
  if (chapter === NO_CHAPTER && at.get(CHAPTER_KEYS).length === 0) return -1;

  let position = pastChapterZeroEnd(at, chapter)
    ? STORY_CHECKPOINTS.findIndex(({ id }) => id === CHAPTER_ZERO_END_ID)
    : chapterPosition(at, chapter);
  if (position === undefined) return undefined;
  while (isReached(at, position + 1)) position++;
  return position;
}

function chapterPosition(at: SlotUnit, chapter: number): number | undefined {
  const position = STORY_CHECKPOINTS.findIndex(
    (checkpoint) =>
      isChapterCheckpoint(checkpoint) && checkpoint.key === chapter,
  );
  const checkpoint = STORY_CHECKPOINTS[position];
  if (!checkpoint || !isChapterCheckpoint(checkpoint)) return undefined;
  const section = at.get(STORY_QUEST_CHECKPOINTS)[
    storyRecord(at, checkpoint) * STORY_QUEST_CHECKPOINT_COUNT
  ];
  return section === checkpoint.entrySection ||
    (section !== undefined && checkpoint.laterSections.includes(section))
    ? position
    : undefined;
}

const storyRecord = (at: SlotUnit, checkpoint: ChapterCheckpoint) =>
  at.get(STORY_QUEST_IDS).indexOf(checkpoint.quest);

/** A chapter after Chapter Ø, or its last quest cleared. */
function pastChapterZeroEnd(at: SlotUnit, chapter: number): boolean {
  if (chapter > CHAPTER_ZERO_END_KEY) return true;
  if (chapter !== CHAPTER_ZERO_END_KEY) return false;
  const end = STORY_CHECKPOINTS.find(({ id }) => id === CHAPTER_ZERO_END_ID)!;
  return (
    isChapterCheckpoint(end) &&
    at.get(STORY_QUEST_CLEARED)[storyRecord(at, end)] === 1
  );
}

/** Index of the last chapter start at or before the save's chapter. */
function chapterFloor(save: Save): number {
  const chapter = save.slotData.units.of(SAVE_ENTITY).get(CURRENT_CHAPTER)[0]!;
  let floor = -1;
  STORY_CHECKPOINTS.forEach((checkpoint, index) => {
    if (isChapterCheckpoint(checkpoint) && checkpoint.key <= chapter)
      floor = index;
  });
  return floor;
}

/** True once the save's chapter reaches the key of this or a later checkpoint, or everything it writes is there. */
function isReached(at: SlotUnit, index: number): boolean {
  const checkpoint = STORY_CHECKPOINTS[index];
  if (!checkpoint || isChapterCheckpoint(checkpoint)) return false;
  const chapter = at.get(CURRENT_CHAPTER)[0]!;
  const passed = STORY_CHECKPOINTS.slice(index).some(
    ({ key }) => key !== undefined && chapter >= key,
  );
  if (passed) return true;

  const cleared = (
    ids: Attribute<number[]>,
    states: Attribute<number[]>,
    quests: readonly number[] = [],
  ) => {
    if (quests.length === 0) return true;
    const rows = at.get(ids);
    const values = at.get(states);
    return quests.every((quest) => {
      const row = rows.indexOf(quest);
      return row === -1 || values[row] !== 0;
    });
  };
  const listed = () => {
    if (!checkpoint.listedQuests) return true;
    const ids = at.get(COUNTER_QUEST_IDS);
    const opened = at.get(COUNTER_QUEST_OPENED);
    return listedQuests(ids, checkpoint).every(
      (quest) => opened[ids.indexOf(quest)],
    );
  };
  const cycles = checkpoint.confluxCycles ?? 0;
  return (
    (checkpoint.questDifficulty === undefined ||
      at.get(QUEST_DIFFICULTY_UNLOCKED) >= checkpoint.questDifficulty) &&
    (checkpoint.questRank === undefined ||
      at.get(QUEST_RANK_REWARDED) >= checkpoint.questRank) &&
    cleared(
      COUNTER_QUEST_IDS,
      COUNTER_QUEST_CLEARS,
      checkpoint.counterQuests,
    ) &&
    listed() &&
    cleared(
      STORY_CUTSCENE_IDS,
      STORY_CUTSCENE_CLEARS,
      checkpoint.storyCutscenes,
    ) &&
    cleared(SIDE_QUEST_IDS, SIDE_QUEST_STATE, checkpoint.sideQuests) &&
    cleared(STORY_QUEST_IDS, STORY_QUEST_CLEARED, checkpoint.storyQuests) &&
    (cycles === 0 ||
      at
        .get(CONFLUX_CYCLE_CLEARED)
        .slice(0, cycles)
        .every((cycle) => cycle !== 0))
  );
}

const listedQuests = (
  ids: readonly number[],
  { listedQuests: listed }: ProgressCheckpoint,
) =>
  listed
    ? ids.filter(
        (id) => id >>> 12 === listed.prefix && !listed.except?.includes(id),
      )
    : [];

/** Moves a new save, or one at a checkpoint, forward to checkpoint `id`. */
export function advanceStory(
  session: SaveSession,
  id: string,
  now = Date.now(),
) {
  const position = storyPosition(session.save);
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
  if (chapters.length > 0) advanceChapters(session, chapters);
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  for (let index = position + 1; index <= target; index++) {
    const checkpoint = STORY_CHECKPOINTS[index]!;
    if (!isChapterCheckpoint(checkpoint) && !isReached(at, index))
      advanceProgress(session, checkpoint, now);
  }
}

function advanceChapters(
  session: SaveSession,
  steps: readonly ChapterCheckpoint[],
) {
  const destination = steps[steps.length - 1]!;
  const patches: Patch[] = [];
  const units = session.save.slotData.units;
  const at = units.of(SAVE_ENTITY);
  const set = <T, W>(attribute: Attribute<T, W>, value: W) =>
    patches.push(at.patch(attribute, value));

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
    set(attribute, flags);
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
    set(attribute, sections);
  }

  const difficulty = Math.max(
    ...steps.map((step) => step.questDifficulty ?? 0),
  );
  if (difficulty > at.get(QUEST_DIFFICULTY_UNLOCKED))
    set(QUEST_DIFFICULTY_UNLOCKED, difficulty);
  if (difficulty - 1 > at.get(QUEST_RANK_REWARDED))
    set(QUEST_RANK_REWARDED, difficulty - 1);

  set(CURRENT_TOWN, destination.town);
  set(CURRENT_TOWN_CHECKPOINT, destination.townCheckpoint);
  set(CURRENT_CHAPTER, [destination.key, at.get(CURRENT_CHAPTER)[1]!]);

  for (const step of steps) {
    for (const hash of step.islands)
      patches.push(
        units
          .of(units.onlyEntityWhere(ISLAND_KEY, hash))
          .patch(ISLAND_UNLOCKED, true),
      );
  }
  session.patch(patches);

  const storyDifficulty = session.save.systemData.units
    .of(SAVE_ENTITY)
    .get(SYSTEM_STORY_DIFFICULTY);
  const extend = (attribute: Attribute<number[]>, added: readonly number[]) =>
    session.setList(attribute, SAVE_ENTITY, [...at.get(attribute), ...added]);
  const chapterKeys = steps.flatMap((step) => step.chapterKeys);
  const chapterGroups = steps.flatMap((step) => step.chapterGroups);
  extend(CHAPTER_KEYS, chapterKeys);
  extend(
    CHAPTER_BEST_DIFFICULTY,
    chapterKeys.map(() => storyDifficulty),
  );
  for (const attribute of [CHAPTER_ULTIMATE_CLEARED, CHAPTER_ULTIMATE_CLEARS])
    extend(
      attribute,
      chapterKeys.map(() => 0),
    );
  extend(CHAPTER_GROUPS, chapterGroups);
  extend(
    CHAPTER_GROUP_FLAGS,
    chapterGroups.map(() => 0),
  );
}

function advanceProgress(
  session: SaveSession,
  checkpoint: ProgressCheckpoint,
  now: number,
) {
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  const difficulty = checkpoint.questDifficulty ?? 0;
  if (difficulty > at.get(QUEST_DIFFICULTY_UNLOCKED))
    session.patch([at.patch(QUEST_DIFFICULTY_UNLOCKED, difficulty)]);
  const rank = checkpoint.questRank ?? difficulty - 1;
  if (rank > at.get(QUEST_RANK_REWARDED))
    session.patch([at.patch(QUEST_RANK_REWARDED, rank)]);
  clearStoryCutscenes(session, checkpoint.storyCutscenes ?? []);
  clearCounterQuests(session, checkpoint.counterQuests ?? []);
  openCounterQuests(session, [
    ...listedQuests(at.get(COUNTER_QUEST_IDS), checkpoint),
    ...(checkpoint.openedQuests ?? []),
  ]);
  advanceStoryQuests(session, checkpoint);
  for (const summon of checkpoint.summons ?? []) giveSummon(session, summon);

  const patches: Patch[] = [];
  let sideQuestsTaken: number[] | undefined;
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
    patches.push(at.patch(STORY_CUTSCENE_CHECKPOINTS, sections));
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
    patches.push(
      at.patch(SIDE_QUEST_STATE, states),
      at.patch(SIDE_QUEST_ACCEPTED, accepted),
      at.patch(SIDE_QUEST_CHECKPOINTS, sections),
      at.patch(SIDE_QUEST_PROGRESS, progress),
    );
    if (taken.length !== takenBefore) sideQuestsTaken = taken;
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
    patches.push(
      at.patch(CONFLUX_CYCLE_CLEARED, cleared),
      at.patch(CONFLUX_RETURNED, returned),
      at.patch(CONFLUX_RETURNED_AT, returnedAt),
    );
  }

  if (checkpoint.location) {
    const { town, townCheckpoint, spot } = checkpoint.location;
    patches.push(
      at.patch(CURRENT_TOWN, town),
      at.patch(CURRENT_TOWN_CHECKPOINT, townCheckpoint),
      at.patch(LAST_TOWN, town),
      at.patch(LOCATION_STAGE, town),
      at.patch(LOCATION_SPOT, spot),
    );
  }

  if (patches.length > 0) session.patch(patches);
  if (sideQuestsTaken)
    session.setList(SIDE_QUESTS_TAKEN, SAVE_ENTITY, sideQuestsTaken);
}

/** Clears the step's story quests, adds its chapter keys and sets 2506. */
function advanceStoryQuests(
  session: SaveSession,
  checkpoint: ProgressCheckpoint,
) {
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  const patches: Patch[] = [];
  if (checkpoint.storyQuests) {
    const ids = at.get(STORY_QUEST_IDS);
    const records = checkpoint.storyQuests
      .map((quest) => ids.indexOf(quest))
      .filter((record) => record !== -1);
    for (const attribute of [STORY_QUEST_CLEARED, STORY_QUEST_THIRD_CLEARED]) {
      const flags = [...at.get(attribute)];
      for (const record of records) flags[record] = 1;
      patches.push(at.patch(attribute, flags));
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
      patches.push(at.patch(attribute, sections));
    }
    patches.push(
      at.patch(
        STORY_QUEST_LIVE_CLEARED,
        at.get(STORY_QUEST_LIVE_CLEARED).map(() => 0),
      ),
      at.patch(BETWEEN_STORY_QUESTS, 1),
    );
  }
  if (checkpoint.begunQuest) {
    session.patch(patches.splice(0));
    const { quest, section } = checkpoint.begunQuest;
    const record = at.get(STORY_QUEST_IDS).indexOf(quest);
    if (record === -1) throw new Error(`no story quest ${quest.toString(16)}`);
    for (const attribute of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      const sections = [...at.get(attribute)];
      sections[record * STORY_QUEST_CHECKPOINT_COUNT] = section;
      patches.push(at.patch(attribute, sections));
    }
    patches.push(
      at.patch(STORY_QUEST_LIVE_CLEARED, [...at.get(STORY_QUEST_CLEARED)]),
      at.patch(BETWEEN_STORY_QUESTS, 0),
    );
  }
  if (
    checkpoint.chapter !== undefined &&
    checkpoint.chapter > at.get(CURRENT_CHAPTER)[0]!
  )
    patches.push(
      at.patch(CURRENT_CHAPTER, [
        checkpoint.chapter,
        at.get(CURRENT_CHAPTER)[1]!,
      ]),
    );
  if (patches.length > 0) session.patch(patches);

  if (checkpoint.chapterGroups) {
    const groups = at.get(CHAPTER_GROUPS);
    const added = checkpoint.chapterGroups.filter(
      ([group]) => !groups.includes(group),
    );
    if (added.length > 0) {
      session.setList(CHAPTER_GROUPS, SAVE_ENTITY, [
        ...groups,
        ...added.map(([group]) => group),
      ]);
      session.setList(CHAPTER_GROUP_FLAGS, SAVE_ENTITY, [
        ...at.get(CHAPTER_GROUP_FLAGS),
        ...added.map(([, flag]) => flag),
      ]);
    }
  }

  const held = at.get(CHAPTER_KEYS);
  const added = (checkpoint.chapterKeys ?? []).filter(
    (key) => !held.includes(key),
  );
  if (added.length === 0) return;
  const storyDifficulty = session.save.systemData.units
    .of(SAVE_ENTITY)
    .get(SYSTEM_STORY_DIFFICULTY);
  const extend = (attribute: Attribute<number[]>, values: readonly number[]) =>
    session.setList(attribute, SAVE_ENTITY, [...at.get(attribute), ...values]);
  extend(CHAPTER_KEYS, added);
  extend(
    CHAPTER_BEST_DIFFICULTY,
    added.map(() => storyDifficulty),
  );
  for (const attribute of [CHAPTER_ULTIMATE_CLEARED, CHAPTER_ULTIMATE_CLEARS])
    extend(
      attribute,
      added.map(() => 0),
    );
}

const LOWEST_GRADE = 0;

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
        : digit >= difficultyDigit("chaos")
          ? CHAOS_QUEST_CLEARS + digit - difficultyDigit("chaos")
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

/** Marks story cutscenes with no clears as played, and returns those it changed. */
export function clearStoryCutscenes(
  session: SaveSession,
  quests: readonly number[],
): string[] {
  const at = session.save.slotData.units.of(SAVE_ENTITY);
  const ids = at.get(STORY_CUTSCENE_IDS);
  const clears = [...at.get(STORY_CUTSCENE_CLEARS)];
  const checkpoints = [...at.get(STORY_CUTSCENE_CHECKPOINTS)];
  const added: string[] = [];

  for (const quest of quests) {
    const row = ids.indexOf(quest);
    if (row === -1 || clears[row] !== 0) continue;
    clears[row] = 1;
    checkpoints[row * STORY_CUTSCENE_CHECKPOINT_VALUES] = 0;
    added.push(`story cutscene ${quest.toString(16)}`);
  }

  if (added.length === 0) return added;
  session.patch([
    at.patch(STORY_CUTSCENE_CLEARS, clears),
    at.patch(STORY_CUTSCENE_CHECKPOINTS, checkpoints),
  ]);
  return added;
}
