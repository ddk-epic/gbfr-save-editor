import { describe, expect, it } from "vitest";
import { readSave } from "../../src/core/read-save";
import { hashId } from "../../src/core/xxhash32-custom";
import { TIP_FLAGS, TIP_KEY } from "../../src/domains/journal/attributes";
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
  STORY_QUEST_CHECKPOINTS,
  STORY_QUEST_CHECKPOINTS_LIVE,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  STORY_QUEST_LIVE_CLEARED,
  STORY_QUEST_THIRD_CLEARED,
  SYSTEM_STORY_DIFFICULTY,
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "../../src/domains/story/attributes";
import { advanceStory, storyTargets } from "../../src/domains/story/edit";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile } from "../../src/testing";

const QUESTS = [
  0x101f00, 0x101000, 0x100006, 0x100005, 0x100003, 0x100002, 0x100001,
  0x100000, 0x101001, 0x101002, 0x101003, 0x101004, 0x101005, 0x102000,
  0x102f00, 0x102002, 0x103f00, 0x103001,
];
const PART = 200;
const NEW_GAME_RECORD = 5;
const NEW_GAME_SECTION = 792562208;
const FIRST_SECTION = 1299620138;
const CHAPTER_3_RECORD = 10;
const CHAPTER_3_SECTION = 2130360527;
const CHAPTER_4_RECORD = 13;
const CHAPTER_4_SECTION = 240333228;
const CHAPTER_5_RECORD = 17;
const CHAPTER_5_SECTION = 528160042;

const newSave = (overrides: { chapter?: number[]; section?: number } = {}) => {
  const sections = Array<number>(QUESTS.length * PART).fill(0);
  sections[NEW_GAME_RECORD * PART] = NEW_GAME_SECTION;
  if (overrides.section !== undefined) sections[0] = overrides.section;
  const bytes = fixtureFile(
    {
      0: [
        [SAVE_HASHSEED, 23],
        [CURRENT_TOWN, 3872],
        [CURRENT_TOWN_CHECKPOINT, 528045455],
        [CURRENT_CHAPTER, overrides.chapter ?? [-1, -1]],
        [STORY_QUEST_IDS, QUESTS],
        [STORY_QUEST_CLEARED, QUESTS.map(() => 0)],
        [STORY_QUEST_LIVE_CLEARED, QUESTS.map(() => 0)],
        [STORY_QUEST_THIRD_CLEARED, QUESTS.map(() => 0)],
        [STORY_QUEST_CHECKPOINTS, sections],
        [STORY_QUEST_CHECKPOINTS_LIVE, sections],
        [CHAPTER_KEYS, []],
        [CHAPTER_BEST_DIFFICULTY, []],
        [CHAPTER_ULTIMATE_CLEARED, []],
        [CHAPTER_ULTIMATE_CLEARS, []],
        [CHAPTER_GROUPS, []],
        [CHAPTER_GROUP_FLAGS, []],
        [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
        [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
      ],
      94: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_MAP")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      88: [
        [TUTORIAL_MENU_KEY, hashId("TUTORIAL_MAP")],
        [TUTORIAL_MENU_FLAGS, 0],
      ],
      91: [
        [TUTORIAL_MENU_KEY, hashId("TUTORIAL_PAD_ASSSGN")],
        [TUTORIAL_MENU_FLAGS, 0],
      ],
      229: [
        [TIP_KEY, 594130054],
        [TIP_FLAGS, 2],
      ],
      230: [
        [TIP_KEY, 2065024838],
        [TIP_FLAGS, 2],
      ],
      34: [
        [TUTORIAL_WINDOW_KEY, hashId("TUTORIAL_WIN_07")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      35: [
        [TUTORIAL_WINDOW_KEY, hashId("TUTORIAL_WIN_32")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      36: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_GN")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      128: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_ACT_PL0000")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      129: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_ACT_PL0100")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      131: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_48")],
        [TIP_FLAGS, 2],
      ],
      204: [
        [TIP_KEY, 0x1c841dc4],
        [TIP_FLAGS, 2],
      ],
      214: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_55")],
        [TIP_FLAGS, 2],
      ],
      52: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_BOSSARTSAURA")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      24: [
        [TUTORIAL_MENU_KEY, hashId("TUTORIAL_GN")],
        [TUTORIAL_MENU_FLAGS, 0],
      ],
      83: [
        [TUTORIAL_MENU_KEY, hashId("TUTORIAL_BOSSARTSAURA")],
        [TUTORIAL_MENU_FLAGS, 0],
      ],
      109: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_43")],
        [TIP_FLAGS, 2],
      ],
      2: [
        [ISLAND_KEY, hashId("ISLAND_1ST")],
        [ISLAND_UNLOCKED, false],
      ],
      3: [
        [ISLAND_KEY, hashId("ISLAND_2ST")],
        [ISLAND_UNLOCKED, false],
      ],
      4: [
        [ISLAND_KEY, hashId("ISLAND_3ST")],
        [ISLAND_UNLOCKED, false],
      ],
      37: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_CHARATICKET")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      40: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_SHOPFUNC")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      133: [
        [TIP_KEY, 0x6f1a2d86],
        [TIP_FLAGS, 2],
      ],
      235: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_65")],
        [TIP_FLAGS, 2],
      ],
      248: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_80")],
        [TIP_FLAGS, 2],
      ],
    },
    { 0: [[SYSTEM_STORY_DIFFICULTY, 2]] },
  );
  const roomy = new Uint8Array(bytes.length + 4096);
  roomy.set(bytes);
  return SaveSession.open(roomy);
};

describe("advanceStory", () => {
  it("moves a new save to the start of Chapter 2", () => {
    const session = newSave();
    advanceStory(session, 40);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([40, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xc00);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(939223336);
    expect(at.get(CHAPTER_KEYS)).toEqual([0, 1, 20, 21, 22]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual([2, 2, 2, 2, 2]);
    expect(at.get(CHAPTER_ULTIMATE_CLEARED)).toEqual([0, 0, 0, 0, 0]);
    expect(at.get(CHAPTER_ULTIMATE_CLEARS)).toEqual([0, 0, 0, 0, 0]);
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[0]).toBe(FIRST_SECTION);
      expect(at.get(sections)[NEW_GAME_RECORD * PART]).toBe(0);
    }

    expect(at.get(TROPHY_EARNED)[1]).toBe(true);
    expect(at.get(TROPHY_EARNED)[1405]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(4n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(1n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(1n);

    expect(units.values(TUTORIAL_WINDOW_FLAGS, 94)).toEqual([1]);
    expect(units.values(TUTORIAL_MENU_FLAGS, 88)).toEqual([1]);
    expect(units.values(TUTORIAL_MENU_FLAGS, 91)).toEqual([1]);
    expect(units.values(TIP_FLAGS, 229)).toEqual([3]);
    expect(units.values(TIP_FLAGS, 230)).toEqual([3]);
    expect(units.values(ISLAND_UNLOCKED, 2)).toEqual([true]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 2", [40]],
  ])("moves %s to the start of Chapter 3", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 60);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([60, -1]);
    expect(at.get(CHAPTER_KEYS)).toEqual([0, 1, 20, 21, 22, 40, 41]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(at.get(CHAPTER_ULTIMATE_CLEARED)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(at.get(CHAPTER_ULTIMATE_CLEARS)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[0]).toBe(0);
      expect(at.get(sections)[CHAPTER_3_RECORD * PART]).toBe(CHAPTER_3_SECTION);
    }

    for (const trophy of [1, 2, 1405, 1406])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(6n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(2n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(2n);

    for (const entity of [34, 35, 36, 94, 128, 129])
      expect(units.values(TUTORIAL_WINDOW_FLAGS, entity)).toEqual([1]);
    for (const entity of [131, 204, 214, 229, 230])
      expect(units.values(TIP_FLAGS, entity)).toEqual([3]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 3", [60]],
  ])("moves %s to the start of Chapter 4", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 80);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([80, -1]);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(10).fill(2));
    expect(at.get(CHAPTER_ULTIMATE_CLEARED)).toEqual(Array(10).fill(0));
    expect(at.get(CHAPTER_ULTIMATE_CLEARS)).toEqual(Array(10).fill(0));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0, 0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_3_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_4_RECORD * PART]).toBe(CHAPTER_4_SECTION);
    }

    for (const trophy of [1, 2, 3, 1405, 1406, 1407])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(9n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(3n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(3n);

    expect(units.values(TUTORIAL_WINDOW_FLAGS, 52)).toEqual([1]);
    expect(units.values(TUTORIAL_MENU_FLAGS, 24)).toEqual([1]);
    expect(units.values(TUTORIAL_MENU_FLAGS, 83)).toEqual([1]);
    expect(units.values(TIP_FLAGS, 109)).toEqual([3]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 4", [80]],
  ])("moves %s to the start of Chapter 5", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 100);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([100, -1]);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(13).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0, 0, 0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_4_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_5_RECORD * PART]).toBe(CHAPTER_5_SECTION);
    }

    for (const trophy of [4, 1408])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(13n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(4n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(4n);

    for (const entity of [37, 40])
      expect(units.values(TUTORIAL_WINDOW_FLAGS, entity)).toEqual([1]);
    for (const entity of [133, 235, 248])
      expect(units.values(TIP_FLAGS, entity)).toEqual([3]);
    expect(units.values(ISLAND_UNLOCKED, 3)).toEqual([true]);
    expect(units.values(ISLAND_UNLOCKED, 4)).toEqual([true]);
  });

  it("accepts the section the game moves a chapter start to", () => {
    const session = newSave({ chapter: [40, -1], section: 18604228 });
    expect(storyTargets(session).map(({ key }) => key)).toEqual([60, 80, 100]);
  });

  it("refuses staying in place and offers nothing behind the save", () => {
    const session = newSave();
    expect(storyTargets(session).map(({ key }) => key)).toEqual([
      40, 60, 80, 100,
    ]);
    advanceStory(session, 100);
    expect(() => advanceStory(session, 80)).toThrow("already at or past");
    expect(() => advanceStory(session, 100)).toThrow("already at or past");
    expect(storyTargets(session)).toEqual([]);
  });

  it("refuses a chapter that is no checkpoint", () => {
    expect(() => advanceStory(newSave(), 41)).toThrow(
      "no story checkpoint at chapter 41",
    );
  });

  it("refuses a save in the middle of the story", () => {
    const midChapter = newSave({ chapter: [41, -1] });
    expect(() => advanceStory(midChapter, 40)).toThrow("not new or at");
    expect(storyTargets(midChapter)).toEqual([]);

    const midQuest = newSave({ chapter: [40, -1], section: 12345 });
    expect(() => advanceStory(midQuest, 40)).toThrow("not new or at");
    expect(storyTargets(midQuest)).toEqual([]);
  });
});
