import {
  type Attribute,
  type EntityReader,
  type Save,
  type Units,
  SAVE_ENTITY,
} from "@gbfr/core";
import { CONFLUX_CYCLE_CLEARED } from "@gbfr/conflux";
import {
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  QUEST_DIFFICULTY_UNLOCKED,
  QUEST_RANK_REWARDED,
  SIDE_QUEST_IDS,
  SIDE_QUEST_STATE,
  STORY_CUTSCENE_CLEARS,
  STORY_CUTSCENE_IDS,
} from "@gbfr/quest";
import {
  CHAPTER_KEYS,
  CURRENT_CHAPTER,
  NO_CHAPTER,
  STORY_QUEST_CHECKPOINT_COUNT,
  STORY_QUEST_CHECKPOINTS,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  SYSTEM_STORY_DIFFICULTY,
} from "./attributes";
import {
  type ChapterCheckpoint,
  CHAPTER_ZERO_END_KEY,
  isChapterCheckpoint,
  type ProgressCheckpoint,
  STORY_CHECKPOINTS,
  type StoryCheckpoint,
} from "./checkpoints";

const CHAPTER_ZERO_END_ID = "chapterZeroEnd";

/** The difficulty the system data records for the story. */
export const storyDifficulty = (save: Save) =>
  save.systemData.units.of(SAVE_ENTITY).get(SYSTEM_STORY_DIFFICULTY);

/** The checkpoints a save can advance to, in story order. */
export function storyTargets(save: Save): readonly StoryCheckpoint[] {
  const position = storyPosition(save.slotData.units);
  return position === undefined ? [] : STORY_CHECKPOINTS.slice(position + 1);
}

/** Each checkpoint, completed once the save reaches the next one. */
export function storyProgress(
  save: Save,
): readonly { checkpoint: StoryCheckpoint; completed: boolean }[] {
  const position = storyPosition(save.slotData.units) ?? chapterFloor(save);
  return STORY_CHECKPOINTS.map((checkpoint, index) => ({
    checkpoint,
    completed: index < position,
  }));
}

/** Index of the last checkpoint the save has reached, -1 on a new save, undefined anywhere else. */
export function storyPosition(units: Units): number | undefined {
  const at = units.of(SAVE_ENTITY);
  const chapter = at.get(CURRENT_CHAPTER)[0]!;
  if (chapter === NO_CHAPTER && at.get(CHAPTER_KEYS).length === 0) return -1;

  let position = pastChapterZeroEnd(at, chapter)
    ? STORY_CHECKPOINTS.findIndex(({ id }) => id === CHAPTER_ZERO_END_ID)
    : chapterPosition(at, chapter);
  if (position === undefined) return undefined;
  while (isReached(at, position + 1)) position++;
  return position;
}

function chapterPosition(
  at: EntityReader,
  chapter: number,
): number | undefined {
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

const storyRecord = (at: EntityReader, checkpoint: ChapterCheckpoint) =>
  at.get(STORY_QUEST_IDS).indexOf(checkpoint.quest);

/** A chapter after Chapter Ø, or its last quest cleared. */
function pastChapterZeroEnd(at: EntityReader, chapter: number): boolean {
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
export function isReached(at: EntityReader, index: number): boolean {
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

export const listedQuests = (
  ids: readonly number[],
  { listedQuests: listed }: ProgressCheckpoint,
) =>
  listed
    ? ids.filter(
        (id) => id >>> 12 === listed.prefix && !listed.except?.includes(id),
      )
    : [];
