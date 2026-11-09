import { describe, expect, it } from "vitest";
import {
  CONFLUX_CYCLE_CLEARED,
  CONFLUX_RETURNED,
  CONFLUX_RETURNED_AT,
} from "../../packages/conflux/attributes";
import { CAPTAIN } from "../../packages/character/attributes";
import { hashId } from "../../packages/core";
import { readSave } from "../../packages/core/read-save";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../../packages/item/attributes";
import { SAVE_HASHSEED } from "../../packages/core/save-entity";
import { SaveSession } from "../../packages/core/session";
import { fixtureFile } from "../../packages/gbfr-save-editor/testing";
import {
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
} from "../../packages/profile/attributes";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
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
} from "../../packages/quest/attributes";
import {
  CURRENT_CHAPTER,
  CURRENT_TOWN,
  CURRENT_TOWN_CHECKPOINT,
  LAST_TOWN,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  UI_FEATURE_UNLOCKED,
} from "../../packages/story/attributes";
import {
  LOCATION_SPOT,
  LOCATION_STAGE,
  USER_RUPIES,
} from "../../packages/user/attributes";
import { WEAPON_LAST_ID } from "../../packages/weapon/attributes";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../packages/trophy/attributes";
import { advanceStory, storyTargets } from "../../packages/story/edit";

const NOW = 1794162545000;
const SIDE_QUESTS = [0x220101, 0x220102, 0x220111];
const STORY_CUTSCENES = [
  0x730201, 0x730021, 0x730020, 0x725110, 0x730420, 0x730046, 0x730430,
];

const save = (difficulty: number, chapter: number) => {
  const bytes = fixtureFile({
    0: [
      [SAVE_HASHSEED, 23],
      [QUEST_DIFFICULTY_UNLOCKED, difficulty],
      [CURRENT_CHAPTER, [chapter, -1]],
      [STORY_QUEST_IDS, [0x10a031]],
      [STORY_QUEST_CLEARED, [1]],
      [CURRENT_TOWN, 0xd00],
      [CURRENT_TOWN_CHECKPOINT, 259724609],
      [LAST_TOWN, 0xd00],
      [LOCATION_STAGE, 0xd00],
      [LOCATION_SPOT, [49, 95, 83, 84, 65, 82, 84, 0]],
      [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
      [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
      [STORY_CUTSCENE_IDS, STORY_CUTSCENES],
      [STORY_CUTSCENE_CLEARS, Array<number>(STORY_CUTSCENES.length).fill(0)],
      [
        STORY_CUTSCENE_CHECKPOINTS,
        Array<number>(STORY_CUTSCENES.length * 64).fill(0),
      ],
      [SIDE_QUEST_IDS, SIDE_QUESTS],
      [SIDE_QUEST_STATE, [0, 0, 0]],
      [SIDE_QUEST_ACCEPTED, [false, false, false]],
      [SIDE_QUEST_CHECKPOINTS, Array<number>(192).fill(0)],
      [SIDE_QUEST_PROGRESS, Array<number>(96).fill(0)],
      [SIDE_QUESTS_TAKEN, [0x220001]],
      [CONFLUX_CYCLE_CLEARED, [0, 0, 0, 0, 0]],
      [CONFLUX_RETURNED, [false, false, false, false, false]],
      [CONFLUX_RETURNED_AT, [0, 0, 0, 0, 0]],
      [COUNTER_QUEST_IDS, [0x408301, 0x408302]],
      [COUNTER_QUEST_CLEARS, [0, 0]],
      [COUNTER_QUEST_FLAGS, [7, 7]],
      [COUNTER_QUEST_OPENED, [false, false]],
      [COUNTER_QUEST_CLEARED, [false, false]],
      [ITEM_ACQUIRED_LAST, 7],
      [UI_FEATURE_UNLOCKED, Array<boolean>(128).fill(false)],
      [WEAPON_LAST_ID, 3],
      [CAPTAIN, 1],
      [USER_RUPIES, 1000],
    ],
    360: [
      [ITEM_KEY, hashId("ITEM_23_0000")],
      [ITEM_COUNT, 3],
      [ITEM_FLAGS, 0],
      [ITEM_ACQUIRED, 0],
    ],
    [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 3]],
  });
  const roomy = new Uint8Array(bytes.length + 4096);
  roomy.set(bytes);
  return SaveSession.open(roomy);
};

const targets = (session: SaveSession) =>
  storyTargets(session.save).map(({ id }) => id);

describe("dlcStart", () => {
  it("clears the side quests, Conflux Cycles 1-3 and 00730021, and leaves the town", () => {
    const session = save(6, 222);
    advanceStory(session, "dlcStart", NOW);
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([222, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd00);
    expect(at.get(STORY_CUTSCENE_CLEARS)).toEqual([0, 1, 0, 0, 0, 0, 0]);
    expect(at.get(STORY_CUTSCENE_CHECKPOINTS)[128]).toBe(1174902544);
    expect(at.get(SIDE_QUEST_STATE)).toEqual([1, 1, 0]);
    expect(at.get(CONFLUX_CYCLE_CLEARED)).toEqual([1, 1, 1, 0, 0]);
    expect(targets(session)).toEqual(["advanceToEpilogue"]);
  });
});

describe("advanceToEpilogue", () => {
  it("clears what comes before 00730201 and puts the save in Folca", () => {
    const session = save(7, 222);
    advanceStory(session, "advanceToEpilogue", NOW);
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([222, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xc00);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(939223336);
    expect(at.get(LAST_TOWN)).toBe(0xc00);
    expect(at.get(LOCATION_STAGE)).toBe(0xc00);
    expect(at.get(LOCATION_SPOT)).toBe("START");
    expect(at.get(STORY_CUTSCENE_CLEARS)).toEqual([0, 1, 0, 1, 1, 1, 0]);
    expect(at.get(STORY_CUTSCENE_CHECKPOINTS)[128]).toBe(1174902544);
    expect(at.get(STORY_CUTSCENE_CHECKPOINTS)[6 * 64]).toBe(1825705739);
    expect(at.get(SIDE_QUEST_STATE)).toEqual([1, 1, 0]);
    expect(at.get(SIDE_QUEST_ACCEPTED)).toEqual([true, true, false]);
    expect(at.get(SIDE_QUEST_CHECKPOINTS)[128]).toBe(1297300194);
    expect(at.get(SIDE_QUESTS_TAKEN)).toEqual([0x220001, 0x220101, 0x220102]);
    expect(at.get(CONFLUX_CYCLE_CLEARED)).toEqual([1, 1, 1, 0, 0]);
    expect(at.get(CONFLUX_RETURNED)).toEqual([true, true, true, false, false]);
    expect(at.get(CONFLUX_RETURNED_AT)).toEqual([
      1794162545, 1794162545, 1794162545, 0, 0,
    ]);
    expect(at.get(COUNTER_QUEST_OPENED)).toEqual([false, false]);

    const earned = at.get(TROPHY_EARNED);
    expect(earned[52]).toBe(false);
    expect(at.get(TROPHY_PROGRESS)[27]).toBe(0n);
  });

  it("follows the Proud checkpoints and the DLC start after Chapter Ø", () => {
    expect(targets(save(6, 222))).toEqual([
      "promoteToProud",
      "dlcStart",
      "unlockProudQuests",
      "advanceToEpilogue",
    ]);
    expect(targets(save(7, 222))).toEqual([
      "dlcStart",
      "unlockProudQuests",
      "advanceToEpilogue",
    ]);
    expect(targets(save(7, 200))).toEqual([]);
  });

  it("is not offered once done, nor once the game moves the chapter", () => {
    const session = save(7, 222);
    advanceStory(session, "advanceToEpilogue", NOW);
    expect(targets(session)).toEqual([]);
    expect(targets(save(7, 240))).toEqual([]);
  });
});
