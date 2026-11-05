import type { Attribute } from "../../core/attribute";
import type { Save } from "../../core/read-save";
import type { Patch, SaveSession } from "../../save/session";
import { SAVE_ENTITY } from "../user/attributes";
import {
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
import { STORY_CHECKPOINTS, type StoryCheckpoint } from "./checkpoints";
import { onlyEntity } from "./only-entity";

/** The checkpoints a save can advance to, in story order. */
export function storyTargets(save: Save): readonly StoryCheckpoint[] {
  const position = storyPosition(save);
  return position === undefined ? [] : STORY_CHECKPOINTS.slice(position + 1);
}

/** Each checkpoint, completed once the save reaches the next one. */
export function storyProgress(
  save: Save,
): readonly { key: number; completed: boolean }[] {
  const chapter = save.slotData.units.of(SAVE_ENTITY).get(CURRENT_CHAPTER)[0]!;
  return STORY_CHECKPOINTS.map(({ key }, index) => {
    const next = STORY_CHECKPOINTS[index + 1];
    return { key, completed: next !== undefined && next.key <= chapter };
  });
}

/** Index of the checkpoint the save is at, -1 on a new save, undefined anywhere else. */
function storyPosition(save: Save): number | undefined {
  const at = save.slotData.units.of(SAVE_ENTITY);
  const chapter = at.get(CURRENT_CHAPTER)[0];
  if (chapter === NO_CHAPTER && at.get(CHAPTER_KEYS).length === 0) return -1;

  const position = STORY_CHECKPOINTS.findIndex(({ key }) => key === chapter);
  const checkpoint = STORY_CHECKPOINTS[position];
  if (!checkpoint) return undefined;
  const record = at.get(STORY_QUEST_IDS).indexOf(checkpoint.quest);
  const section = at.get(STORY_QUEST_CHECKPOINTS)[
    record * STORY_QUEST_CHECKPOINT_COUNT
  ];
  return section === checkpoint.entrySection ||
    (section !== undefined && checkpoint.laterSections.includes(section))
    ? position
    : undefined;
}

/** Moves a new save, or one at a checkpoint, forward to the start of chapter `key`. */
export function advanceStory(session: SaveSession, key: number) {
  const position = storyPosition(session.save);
  if (position === undefined)
    throw new Error("the save is not new or at a story checkpoint");
  const target = STORY_CHECKPOINTS.findIndex(
    (checkpoint) => checkpoint.key === key,
  );
  if (target === -1) throw new Error(`no story checkpoint at chapter ${key}`);
  if (target <= position)
    throw new Error(`the save is already at or past chapter ${key}`);

  const steps = STORY_CHECKPOINTS.slice(position + 1, target + 1);
  const destination = steps[steps.length - 1]!;
  const patches: Patch[] = [];
  const units = session.save.slotData.units;
  const at = units.of(SAVE_ENTITY);
  const set = (attribute: Attribute<unknown>, values: readonly unknown[]) =>
    patches.push({ attribute, entity: SAVE_ENTITY, values });

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

  set(CURRENT_TOWN, [destination.town]);
  set(CURRENT_TOWN_CHECKPOINT, [destination.townCheckpoint]);
  set(CURRENT_CHAPTER, [destination.key, at.get(CURRENT_CHAPTER)[1]]);

  for (const step of steps) {
    for (const hash of step.islands)
      patches.push({
        attribute: ISLAND_UNLOCKED,
        entity: onlyEntity(units, ISLAND_KEY, hash),
        values: [true],
      });
  }
  session.patch(patches);

  const difficulty = session.save.systemData.units
    .of(SAVE_ENTITY)
    .get(SYSTEM_STORY_DIFFICULTY);
  const extend = (attribute: Attribute<number[]>, added: readonly number[]) =>
    session.setList(attribute, SAVE_ENTITY, [...at.get(attribute), ...added]);
  const chapterKeys = steps.flatMap((step) => step.chapterKeys);
  const chapterGroups = steps.flatMap((step) => step.chapterGroups);
  extend(CHAPTER_KEYS, chapterKeys);
  extend(
    CHAPTER_BEST_DIFFICULTY,
    chapterKeys.map(() => difficulty),
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
