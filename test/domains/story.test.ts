import { describe, expect, it } from "vitest";
import { readSave } from "../../src/core/read-save";
import { hashId } from "../../src/core/xxhash32-custom";
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
} from "../../src/domains/story/attributes";
import { advanceStory, storyTargets } from "../../src/domains/story/edit";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile } from "../../src/testing";

const QUESTS = [
  0x101f00, 0x101000, 0x100006, 0x100005, 0x100003, 0x100002, 0x100001,
  0x100000, 0x101001, 0x101002, 0x101003, 0x101004, 0x101005, 0x102000,
  0x102f00, 0x102002, 0x103f00, 0x103001, 0x104f00, 0x104000, 0x104f01,
  0x104003, 0x104001, 0x104002, 0x105f00, 0x105001, 0x105f01, 0x105002,
  0x106f00, 0x106000, 0x106001, 0x106002, 0x107000, 0x107f00, 0x107002,
  0x107001, 0x107003, 0x108f00, 0x108000, 0x108002, 0x108001, 0x109001,
  0x109000, 0x109002,
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
const CHAPTER_6_RECORD = 19;
const CHAPTER_6_SECTION = 1222948280;
const CHAPTER_7_RECORD = 25;
const CHAPTER_7_SECTION = 72948621;
const CHAPTER_8_RECORD = 29;
const CHAPTER_8_SECTION = 488331365;
const CHAPTER_9_RECORD = 32;
const CHAPTER_9_SECTION = 111915467;
const CHAPTER_10_RECORD = 37;
const CHAPTER_10_SECTION = 1349186703;
const CHAPTER_ZERO_RECORD = 43;
const CHAPTER_ZERO_SECTION = 274192714;

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
      5: [
        [ISLAND_KEY, hashId("ISLAND_4ST")],
        [ISLAND_UNLOCKED, false],
      ],
      6: [
        [ISLAND_KEY, hashId("ISLAND_5ST")],
        [ISLAND_UNLOCKED, false],
      ],
      7: [
        [ISLAND_KEY, hashId("ISLAND_6ST")],
        [ISLAND_UNLOCKED, false],
      ],
      8: [
        [ISLAND_KEY, hashId("ISLAND_7ST")],
        [ISLAND_UNLOCKED, false],
      ],
      9: [
        [ISLAND_KEY, hashId("ISLAND_8ST")],
        [ISLAND_UNLOCKED, false],
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
        0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[0]).toBe(FIRST_SECTION);
      expect(at.get(sections)[NEW_GAME_RECORD * PART]).toBe(0);
    }

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
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[0]).toBe(0);
      expect(at.get(sections)[CHAPTER_3_RECORD * PART]).toBe(CHAPTER_3_SECTION);
    }
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
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_3_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_4_RECORD * PART]).toBe(CHAPTER_4_SECTION);
    }
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
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_4_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_5_RECORD * PART]).toBe(CHAPTER_5_SECTION);
    }

    expect(units.values(ISLAND_UNLOCKED, 3)).toEqual([true]);
    expect(units.values(ISLAND_UNLOCKED, 4)).toEqual([true]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 5", [100]],
  ])("moves %s to the start of Chapter 6", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 120);
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([120, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd00);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(821073149);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(18).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0, 0, 0, 0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        ...Array<number>(19).fill(1),
        ...Array<number>(25).fill(0),
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_5_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_6_RECORD * PART]).toBe(CHAPTER_6_SECTION);
    }
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 6", [120]],
  ])("moves %s to the start of Chapter 7", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 140);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([140, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd00);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(528045455);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
      120, 121, 122, 123,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(22).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 0, 0, 0, 0, 0, 0]);

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        ...Array<number>(25).fill(1),
        ...Array<number>(19).fill(0),
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_6_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_7_RECORD * PART]).toBe(CHAPTER_7_SECTION);
    }

    expect(units.values(ISLAND_UNLOCKED, 5)).toEqual([true]);
    expect(units.values(ISLAND_UNLOCKED, 6)).toEqual([true]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 7", [140]],
  ])("moves %s to the start of Chapter 8", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 160);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([160, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd01);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(528045455);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
      120, 121, 122, 123, 140, 141, 142, 143,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(26).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual(Array(8).fill(0));

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        ...Array<number>(29).fill(1),
        ...Array<number>(15).fill(0),
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_7_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_8_RECORD * PART]).toBe(CHAPTER_8_SECTION);
    }

    expect(units.values(ISLAND_UNLOCKED, 7)).toEqual([true]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 8", [160]],
  ])("moves %s to the start of Chapter 9", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 180);
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([180, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd02);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(528045455);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
      120, 121, 122, 123, 140, 141, 142, 143, 160, 161, 162, 163, 164,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(31).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual(Array(9).fill(0));

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        ...Array<number>(32).fill(1),
        ...Array<number>(12).fill(0),
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_8_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_9_RECORD * PART]).toBe(CHAPTER_9_SECTION);
    }
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 9", [180]],
  ])("moves %s to the start of Chapter 10", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 200);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([200, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xd02);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(528045455);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
      120, 121, 122, 123, 140, 141, 142, 143, 160, 161, 162, 163, 164, 180, 181,
      182, 183, 184, 185,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(37).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual(Array(10).fill(0));

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([
        ...Array<number>(37).fill(1),
        ...Array<number>(7).fill(0),
      ]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_9_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_10_RECORD * PART]).toBe(
        CHAPTER_10_SECTION,
      );
    }

    expect(units.values(ISLAND_UNLOCKED, 8)).toEqual([true]);
  });

  it.each([
    ["a new save", []],
    ["the start of Chapter 10", [200]],
  ])("moves %s to the start of Chapter Ø", (_, before) => {
    const session = newSave();
    for (const key of before) advanceStory(session, key);
    advanceStory(session, 220);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(CURRENT_CHAPTER)).toEqual([220, -1]);
    expect(at.get(CURRENT_TOWN)).toBe(0xc00);
    expect(at.get(CURRENT_TOWN_CHECKPOINT)).toBe(939223336);
    expect(at.get(CHAPTER_KEYS)).toEqual([
      0, 1, 20, 21, 22, 40, 41, 60, 61, 62, 80, 81, 82, 100, 101, 102, 103, 104,
      120, 121, 122, 123, 140, 141, 142, 143, 160, 161, 162, 163, 164, 180, 181,
      182, 183, 184, 185, 200,
    ]);
    expect(at.get(CHAPTER_BEST_DIFFICULTY)).toEqual(Array(38).fill(2));
    expect(at.get(CHAPTER_GROUPS)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual(Array(11).fill(0));

    for (const flags of [
      STORY_QUEST_CLEARED,
      STORY_QUEST_LIVE_CLEARED,
      STORY_QUEST_THIRD_CLEARED,
    ])
      expect(at.get(flags)).toEqual([...Array<number>(43).fill(1), 0]);

    for (const sections of [
      STORY_QUEST_CHECKPOINTS,
      STORY_QUEST_CHECKPOINTS_LIVE,
    ]) {
      expect(at.get(sections)[CHAPTER_10_RECORD * PART]).toBe(0);
      expect(at.get(sections)[CHAPTER_ZERO_RECORD * PART]).toBe(
        CHAPTER_ZERO_SECTION,
      );
    }

    expect(units.values(ISLAND_UNLOCKED, 9)).toEqual([true]);
  });

  it("accepts the section the game moves a chapter start to", () => {
    const session = newSave({ chapter: [40, -1], section: 18604228 });
    expect(storyTargets(session).map(({ key }) => key)).toEqual([
      60, 80, 100, 120, 140, 160, 180, 200, 220,
    ]);
  });

  it("refuses staying in place and offers nothing behind the save", () => {
    const session = newSave();
    expect(storyTargets(session).map(({ key }) => key)).toEqual([
      40, 60, 80, 100, 120, 140, 160, 180, 200, 220,
    ]);
    advanceStory(session, 220);
    expect(() => advanceStory(session, 200)).toThrow("already at or past");
    expect(() => advanceStory(session, 220)).toThrow("already at or past");
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
