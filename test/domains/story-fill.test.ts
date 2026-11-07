import { describe, expect, it } from "vitest";
import type { Attribute } from "../../src/core/attribute";
import { readSave } from "../../src/core/read-save";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_OUTFIT,
  CHARACTER_OUTFITS_OWNED,
  CHARACTER_XP,
  CAPTAIN,
} from "../../src/domains/character/attributes";
import { EQUIP_WEAPON } from "../../src/domains/equipment/attributes";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../../src/domains/item/attributes";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
} from "../../src/domains/journal/attributes";
import { MASTERY_NODE_BITS } from "../../src/domains/mastery/attributes";
import {
  EQUIP_SKILLS,
  SKILL_FLAGS,
  SKILL_KEY,
} from "../../src/domains/skill/attributes";
import {
  CURRENT_CHAPTER,
  UI_FEATURE_UNLOCKED,
} from "../../src/domains/story/attributes";
import { fillSkippedStory } from "../../src/workflows/story-fill";
import {
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
} from "../../src/domains/profile/attributes";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  QUEST_DIFFICULTY_UNLOCKED,
  SHORT_STORY_CHECKPOINTS,
  SHORT_STORY_CLEARS,
  SHORT_STORY_IDS,
} from "../../src/domains/quest/attributes";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
import { SAVE_HASHSEED } from "../../src/core/save-entity";
import { USER_RUPIES } from "../../src/domains/user/attributes";
import {
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "../../src/domains/weapon/attributes";
import { SaveSession } from "../../src/core/session";
import { fixtureFile } from "../../src/testing";

const ITEMS = [
  "ITEM_70_0004",
  "ITEM_70_0005",
  "ITEM_70_0006",
  "ITEM_70_0010",
  "ITEM_10_0001",
  "ITEM_10_0002",
  "ITEM_10_0003",
  "ITEM_70_0008",
  "ITEM_70_0001",
  "ITEM_70_0003",
] as const;
const ITEM_ENTITY = 300;
const STONE_ENTITY = ITEM_ENTITY + 7;
const LIFE_LINK_ENTITY = ITEM_ENTITY + 8;
const SKY_MAP_ENTITY = ITEM_ENTITY + 9;
const HELD_SEEN_ITEMS: readonly string[] = ["ITEM_70_0001", "ITEM_70_0003"];
const ARCHIVES = [
  "ARC_OTHER_011",
  "ARC_OTHER_026",
  "ARC_OTHER_058",
  "ARC_OTHER_059",
  "ARC_OTHER_060",
  "ARC_ROLANNOTE_08",
  "ARC_ROLANNOTE_02",
  "ARC_ROLANNOTE_03",
  "ARC_ROLANNOTE_06",
  "ARC_ROLANNOTE_01",
  "ARC_ROLANNOTE_04",
  "ARC_ROLANNOTE_05",
  "ARC_ROLANNOTE_07",
] as const;
const ARCHIVE_ENTITY = 400;
const NOTE_08_ENTITY = ARCHIVE_ENTITY + 5;
const SHORT_STORIES = [
  0x705001, 0x705002, 0x705003, 0x705004, 0x705005, 0x705006, 0x705007,
  0x703000, 0x703001, 0x720000, 0x720001, 0x720002, 0x720003, 0x720004,
  0x730050,
];
const COUNTER_QUESTS = [
  0x403301, 0x403302, 0x403201, 0x403202, 0x403307, 0x403308, 0x403309,
  0x403312, 0x404101, 0x404310, 0x404309, 0x404313, 0x404316, 0x404311,
  0x405101, 0x405201, 0x405206, 0x405207, 0x405202, 0x405203, 0x405208,
  0x405302, 0x405303, 0x405304, 0x405305,
];
const COUNTER_ROWS = COUNTER_QUESTS.length + 2;
const ID_ENTITY = 10023;
const ID_MASTERY_BLOCK = 10023000;
const ID_MASTERY_OFFSETS = [
  ...Array.from({ length: 43 }, (_, offset) => offset),
  ...Array.from({ length: 27 }, (_, offset) => 108 + offset),
];
const skillHash = (n: string) => hashId(`AB_PL1900_${n}`);
const SKILL_ENTITIES: Record<number, string> = {
  194: "02",
  197: "05",
  198: "07",
  199: "08",
};

const UI_FEATURES_NEW_SAVE = Array.from(
  { length: 128 },
  (_, index) => index === 8 || index === 9,
);

const emptyWeapon = (): [Attribute<unknown>, unknown][] => [
  [WEAPON_ID, 0],
  [WEAPON_KEY, hashId("")],
  [WEAPON_XP, 0],
  [WEAPON_UNCAP, 0],
  [WEAPON_FLAGS, 0],
];

const save = (
  overrides: {
    chapter?: number;
    crewLevel?: number;
    idFlags?: number;
    idLevel?: number;
    captain?: number;
  } = {},
) => {
  const bytes = fixtureFile({
    0: [
      [SAVE_HASHSEED, 23],
      [CURRENT_CHAPTER, [overrides.chapter ?? 220, -1]],
      [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
      [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
      [UI_FEATURE_UNLOCKED, UI_FEATURES_NEW_SAVE],
      [ITEM_ACQUIRED_LAST, 7],
      [WEAPON_LAST_ID, 3],
      [CAPTAIN, overrides.captain ?? 1],
      [USER_RUPIES, 1000],
      [QUEST_DIFFICULTY_UNLOCKED, 2],
      [COUNTER_QUEST_IDS, [0x405204, 0x401301, ...COUNTER_QUESTS]],
      [COUNTER_QUEST_CLEARS, Array<number>(COUNTER_ROWS).fill(0)],
      [COUNTER_QUEST_FLAGS, Array<number>(COUNTER_ROWS).fill(7)],
      [COUNTER_QUEST_OPENED, Array<boolean>(COUNTER_ROWS).fill(false)],
      [COUNTER_QUEST_CLEARED, Array<boolean>(COUNTER_ROWS).fill(false)],
      [SHORT_STORY_IDS, [0x704000, 0x704001, ...SHORT_STORIES]],
      [SHORT_STORY_CLEARS, Array<number>(SHORT_STORIES.length + 2).fill(0)],
      [
        SHORT_STORY_CHECKPOINTS,
        Array<number>((SHORT_STORIES.length + 2) * 64).fill(5),
      ],
    ],
    ...Object.fromEntries(
      ITEMS.map((item, index) => [
        ITEM_ENTITY + index,
        [
          [ITEM_KEY, hashId(item)],
          [ITEM_COUNT, HELD_SEEN_ITEMS.includes(item) ? 1 : 0],
          [ITEM_FLAGS, HELD_SEEN_ITEMS.includes(item) ? 12 : 0],
          [ITEM_ACQUIRED, 0],
        ],
      ]),
    ),
    ...Object.fromEntries(
      ARCHIVES.map((archive, index) => [
        ARCHIVE_ENTITY + index,
        [
          [ARCHIVE_KEY, hashId(archive)],
          [ARCHIVE_FLAGS, 0],
        ],
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(SKILL_ENTITIES).map(([entity, n]) => [
        entity,
        [
          [SKILL_KEY, skillHash(n)],
          [SKILL_FLAGS, 0],
        ],
      ]),
    ),
    6: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_PL0000_03")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    7: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_PL0100_03")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    34: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_PL0000_99")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    35: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_PL0100_99")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    271: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_NP0300_01")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    391: [
      [FIELD_NOTE_WEAPON_KEY, hashId("WEP_PL1900_A0")],
      [FIELD_NOTE_WEAPON_FLAGS, 0],
    ],
    [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 0]],
    10000: [
      [CHARACTER_KEY, hashId("PL0000")],
      [CHARACTER_FLAGS, 1],
      [CHARACTER_LEVEL, overrides.crewLevel ?? 1],
      [EQUIP_WEAPON, 1],
      [CHARACTER_OUTFIT, 1],
      [CHARACTER_OUTFITS_OWNED, 2],
    ],
    10001: [
      [CHARACTER_KEY, hashId("PL0100")],
      [CHARACTER_FLAGS, 1],
      [CHARACTER_LEVEL, 1],
      [EQUIP_WEAPON, 3],
      [CHARACTER_OUTFIT, 1],
      [CHARACTER_OUTFITS_OWNED, 2],
    ],
    [ID_ENTITY]: [
      [CHARACTER_KEY, hashId("PL1900")],
      [CHARACTER_XP, 184474],
      [CHARACTER_FLAGS, overrides.idFlags ?? 0],
      [CHARACTER_LEVEL, overrides.idLevel ?? 37],
      [CHARACTER_BASE_HP, 1107],
      [CHARACTER_BASE_ATTACK, 145],
      [EQUIP_SKILLS, [skillHash("01"), 2289754288, 2289754288, 2289754288]],
    ],
    ...Object.fromEntries(
      ID_MASTERY_OFFSETS.map((offset) => [
        ID_MASTERY_BLOCK + offset,
        [[MASTERY_NODE_BITS, 0]],
      ]),
    ),
    40000: [
      [WEAPON_ID, 1],
      [WEAPON_KEY, hashId("WEP_PL0000_01")],
      [WEAPON_XP, 0],
      [WEAPON_UNCAP, 0],
      [WEAPON_FLAGS, 129],
    ],
    40001: [
      [WEAPON_ID, 2],
      [WEAPON_KEY, hashId("WEP_PL0000_02")],
      [WEAPON_XP, 0],
      [WEAPON_UNCAP, 0],
      [WEAPON_FLAGS, 129],
    ],
    40002: [
      [WEAPON_ID, 3],
      [WEAPON_KEY, hashId("WEP_PL0100_01")],
      [WEAPON_XP, 0],
      [WEAPON_UNCAP, 0],
      [WEAPON_FLAGS, 129],
    ],
    40003: emptyWeapon(),
    40004: emptyWeapon(),
    40005: emptyWeapon(),
    40006: emptyWeapon(),
  });
  const roomy = new Uint8Array(bytes.length + 4096);
  roomy.set(bytes);
  return SaveSession.open(roomy);
};

const reread = (session: SaveSession) =>
  readSave(session.export()).slotData.units;

describe("fillSkippedStory", () => {
  it("fills everything due at the start of Chapter Ø", () => {
    const session = save();
    const added = fillSkippedStory(session);
    const units = reread(session);
    const at = units.of(0);

    expect(added).toContain("PL1900");
    for (const trophy of [0, 10, 1, 1405, 9, 1413, 11, 1397])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(38n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(0n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(10n);

    expect(units.values(ITEM_COUNT, ITEM_ENTITY)).toEqual([1]);
    expect(units.values(ITEM_FLAGS, ITEM_ENTITY)).toEqual([4]);
    expect(units.values(ITEM_FLAGS, ITEM_ENTITY + 3)).toEqual([36]);
    expect(units.values(ITEM_ACQUIRED, ITEM_ENTITY)).toEqual([8]);
    expect(units.values(ITEM_ACQUIRED, ITEM_ENTITY + 3)).toEqual([12]);
    expect(at.get(ITEM_ACQUIRED_LAST)).toBe(12);
    expect(units.values(ITEM_COUNT, STONE_ENTITY)).toEqual([0]);
    expect(units.values(ITEM_FLAGS, STONE_ENTITY)).toEqual([4]);
    expect(units.values(ITEM_ACQUIRED, STONE_ENTITY)).toEqual([10]);
    for (const entity of [LIFE_LINK_ENTITY, SKY_MAP_ENTITY]) {
      expect(units.values(ITEM_COUNT, entity)).toEqual([1]);
      expect(units.values(ITEM_FLAGS, entity)).toEqual([4]);
    }

    for (let index = 0; index < 5; index++)
      expect(units.values(ARCHIVE_FLAGS, ARCHIVE_ENTITY + index)).toEqual([1]);
    expect(units.values(ARCHIVE_FLAGS, NOTE_08_ENTITY)).toEqual([3]);
    expect(at.get(TROPHY_PROGRESS)[46]).toBe(6n);
    expect(at.get(TROPHY_PROGRESS)[47]).toBe(6n);

    expect(
      at.get(UI_FEATURE_UNLOCKED).flatMap((on, index) => (on ? [index] : [])),
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(at.get(WEAPON_LAST_ID)).toBe(9);
    expect(units.values(WEAPON_KEY, 40003)).toEqual([hashId("WEP_PL0000_03")]);
    expect(units.values(WEAPON_KEY, 40004)).toEqual([hashId("WEP_PL0100_03")]);
    expect(units.values(WEAPON_KEY, 40005)).toEqual([hashId("WEP_PL0000_99")]);
    expect(units.values(WEAPON_KEY, 40006)).toEqual([hashId("WEP_PL0100_99")]);
    expect(units.values(WEAPON_XP, 40003)).toEqual([1740]);
    expect(units.values(WEAPON_UNCAP, 40003)).toEqual([3]);
    expect(units.values(WEAPON_FLAGS, 40003)).toEqual([129]);
    expect(units.values(WEAPON_XP, 40004)).toEqual([90]);
    expect(units.values(WEAPON_UNCAP, 40004)).toEqual([0]);
    expect(units.values(WEAPON_FLAGS, 40004)).toEqual([128]);
    expect(units.values(WEAPON_XP, 40006)).toEqual([162540]);
    expect(units.values(WEAPON_UNCAP, 40006)).toEqual([6]);
    expect(units.values(WEAPON_FLAGS, 40006)).toEqual([128]);
    expect(units.values(WEAPON_ID, 40000)).toEqual([6]);
    expect(units.values(WEAPON_KEY, 40000)).toEqual([hashId("WEP_PL1900_A0")]);
    expect(units.values(WEAPON_XP, 40000)).toEqual([1740]);
    expect(units.values(WEAPON_UNCAP, 40000)).toEqual([3]);
    expect(units.values(WEAPON_FLAGS, 40000)).toEqual([128]);
    expect(units.values(WEAPON_ID, 40001)).toEqual([2]);
    expect(units.values(WEAPON_ID, 40002)).toEqual([7]);
    expect(units.values(WEAPON_KEY, 40002)).toEqual([hashId("WEP_NP0300_01")]);
    expect(units.values(WEAPON_XP, 40002)).toEqual([2740]);
    expect(units.values(WEAPON_UNCAP, 40002)).toEqual([3]);
    expect(units.values(WEAPON_FLAGS, 40002)).toEqual([128]);
    for (const note of [6, 7, 34, 35, 271, 391])
      expect(units.values(FIELD_NOTE_WEAPON_FLAGS, note)).toEqual([4]);
    expect(units.values(EQUIP_WEAPON, 10000)).toEqual([4]);
    expect(units.values(EQUIP_WEAPON, 10001)).toEqual([9]);
  });

  it("holds Dehg's Catalyst Stone only through Chapter 7", () => {
    const session = save({ chapter: 140 });
    fillSkippedStory(session);
    expect(reread(session).values(ITEM_COUNT, STONE_ENTITY)).toEqual([1]);
    expect(reread(session).values(ITEM_FLAGS, STONE_ENTITY)).toEqual([4]);

    session.patch([
      { attribute: CURRENT_CHAPTER, entity: 0, values: [160, -1] },
    ]);
    expect(fillSkippedStory(session)).toContain("ITEM_70_0008 taken");
    const units = reread(session);
    expect(units.values(ITEM_COUNT, STONE_ENTITY)).toEqual([0]);
    expect(units.values(ITEM_FLAGS, STONE_ENTITY)).toEqual([4]);
  });

  it("brings back each held item's new mark at its chapter", () => {
    const session = save({ chapter: 60 });
    fillSkippedStory(session);
    expect(reread(session).values(ITEM_FLAGS, LIFE_LINK_ENTITY)).toEqual([12]);

    session.patch([
      { attribute: CURRENT_CHAPTER, entity: 0, values: [180, -1] },
    ]);
    fillSkippedStory(session);
    expect(reread(session).values(ITEM_FLAGS, LIFE_LINK_ENTITY)).toEqual([4]);
    expect(reread(session).values(ITEM_FLAGS, SKY_MAP_ENTITY)).toEqual([12]);

    session.patch([
      { attribute: CURRENT_CHAPTER, entity: 0, values: [200, -1] },
    ]);
    fillSkippedStory(session);
    expect(reread(session).values(ITEM_FLAGS, SKY_MAP_ENTITY)).toEqual([4]);
  });

  it("adds no stand-in weapon before Chapter 8", () => {
    const session = save({ chapter: 140 });
    fillSkippedStory(session);
    const units = reread(session);

    expect(units.values(WEAPON_KEY, 40000)).toEqual([hashId("")]);
    expect(units.values(WEAPON_KEY, 40002)).toEqual([hashId("")]);
    expect(units.values(FIELD_NOTE_WEAPON_FLAGS, 391)).toEqual([0]);
  });

  it("raises the stand-in weapons a shorter fill added", () => {
    const session = save({ chapter: 160 });
    fillSkippedStory(session);
    const early = reread(session);
    expect(early.values(WEAPON_XP, 40000)).toEqual([790]);
    expect(early.values(WEAPON_UNCAP, 40000)).toEqual([2]);
    expect(early.values(WEAPON_XP, 40002)).toEqual([1140]);

    session.patch([
      { attribute: CURRENT_CHAPTER, entity: 0, values: [200, -1] },
    ]);
    fillSkippedStory(session);
    const units = reread(session);

    expect(units.values(WEAPON_ID, 40000)).toEqual([6]);
    expect(units.values(WEAPON_XP, 40000)).toEqual([1740]);
    expect(units.values(WEAPON_UNCAP, 40000)).toEqual([3]);
    expect(units.values(WEAPON_ID, 40002)).toEqual([7]);
    expect(units.values(WEAPON_XP, 40002)).toEqual([2740]);
    expect(units.values(WEAPON_UNCAP, 40002)).toEqual([3]);
  });

  it("does not add a stand-in weapon back once sold", () => {
    const session = save({ chapter: 200 });
    session.patch([
      { attribute: FIELD_NOTE_WEAPON_FLAGS, entity: 391, values: [4] },
    ]);
    const added = fillSkippedStory(session);

    expect(added).not.toContain("WEP_PL1900_A0");
    expect(added).toContain("WEP_NP0300_01");
  });

  it("marks the counter quests the story needs as cleared once", () => {
    const session = save({ chapter: 222 });
    fillSkippedStory(session);
    const units = reread(session);
    const at = units.of(0);
    const rows = COUNTER_QUESTS.map(() => 1);

    expect(at.get(COUNTER_QUEST_CLEARS)).toEqual([0, 0, ...rows]);
    expect(at.get(COUNTER_QUEST_FLAGS)).toEqual([7, 7, ...rows.map(() => 0)]);
    expect(at.get(COUNTER_QUEST_OPENED)).toEqual([
      false,
      true,
      ...rows.map(() => true),
    ]);
    expect(at.get(COUNTER_QUEST_CLEARED)).toEqual([
      false,
      false,
      ...rows.map(() => true),
    ]);
    expect(at.get(TROPHY_PROGRESS)[16]).toBe(8n);
    expect(at.get(TROPHY_PROGRESS)[17]).toBe(6n);
    expect(at.get(TROPHY_PROGRESS)[18]).toBe(11n);
    expect(at.get(TROPHY_PROGRESS)[20]).toBe(25n);
    expect(units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED)).toBe(25);
  });

  it("adds what the end of the story should have left", () => {
    const session = save({ chapter: 222 });
    fillSkippedStory(session);
    const units = reread(session);
    const at = units.of(0);

    expect(
      ARCHIVES.slice(5).map(
        (_, index) => units.values(ARCHIVE_FLAGS, NOTE_08_ENTITY + index)![0],
      ),
    ).toEqual([3, 3, 3, 1, 1, 1, 1, 1]);
    expect(at.get(TROPHY_PROGRESS)[46]).toBe(13n);
    expect(at.get(TROPHY_PROGRESS)[47]).toBe(13n);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(41n);

    expect(at.get(SHORT_STORY_CLEARS)).toEqual([
      1,
      1,
      ...SHORT_STORIES.map(() => 1),
    ]);

    expect(at.get(SHORT_STORY_CHECKPOINTS)[0]).toBe(0);
    expect(at.get(SHORT_STORY_CHECKPOINTS)[1]).toBe(5);

    expect(at.get(QUEST_DIFFICULTY_UNLOCKED)).toBe(6);
    for (const trophy of [0, 10, 22, 23, 24, 25, 19, 1398])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_EARNED)[12]).toBe(false);
    expect(at.get(USER_RUPIES)).toBe(81000);
    expect(at.get(TROPHY_PROGRESS)[224]).toBe(80000n);
    expect(units.values(ITEM_COUNT, ITEM_ENTITY + 4)).toEqual([100]);
    expect(units.values(ITEM_COUNT, ITEM_ENTITY + 5)).toEqual([80]);
    expect(units.values(ITEM_COUNT, ITEM_ENTITY + 6)).toEqual([10]);
  });

  it("changes nothing on a second run at the end of the story", () => {
    const session = save({ chapter: 222 });
    fillSkippedStory(session);
    const first = session.export();
    expect(fillSkippedStory(session)).toEqual([]);
    expect(session.export()).toEqual(first);
  });

  it("keeps a quest difficulty already past the story", () => {
    const session = save({ chapter: 222 });
    session.patch([
      { attribute: QUEST_DIFFICULTY_UNLOCKED, entity: 0, values: [7] },
    ]);
    fillSkippedStory(session);
    expect(reread(session).of(0).get(QUEST_DIFFICULTY_UNLOCKED)).toBe(7);
  });

  it("changes nothing on a second run", () => {
    const session = save();
    fillSkippedStory(session);
    const first = session.export();
    expect(fillSkippedStory(session)).toEqual([]);
    expect(session.export()).toEqual(first);
  });

  it("clears 00730050 from the start of chapter 7 on", () => {
    const row = SHORT_STORIES.indexOf(0x730050) + 2;
    for (const [chapter, clears] of [
      [120, 0],
      [140, 1],
    ] as const) {
      const session = save({ chapter });
      fillSkippedStory(session);
      expect(reread(session).of(0).get(SHORT_STORY_CLEARS)[row]).toBe(clears);
    }
  });

  it("stops at the save's current chapter", () => {
    const session = save({ chapter: 80 });
    expect(fillSkippedStory(session)).toEqual([
      "trophy 0",
      "trophy 10",
      "trophy 1",
      "trophy 1405",
      "UI feature 7",
      "trophy 2",
      "trophy 1406",
      "ITEM_70_0004",
      "trophy 3",
      "trophy 1407",
      "ITEM_70_0005",
      "ITEM_70_0001 new mark",
      "ARC_OTHER_011",
      "WEP_PL0000_03",
      "WEP_PL0100_03",
    ]);
    const units = reread(session);
    expect(units.values(ITEM_COUNT, ITEM_ENTITY + 2)).toEqual([0]);
    expect(units.of(0).get(TROPHY_PROGRESS)[2]).toBe(9n);
    expect(
      units
        .of(0)
        .get(UI_FEATURE_UNLOCKED)
        .flatMap((on, index) => (on ? [index] : [])),
    ).toEqual([7, 8, 9]);
  });

  it("swaps the start weapons by the captain in play", () => {
    const session = save({ chapter: 80, captain: 2 });
    fillSkippedStory(session);
    const units = reread(session);

    expect(units.values(WEAPON_FLAGS, 40003)).toEqual([128]);
    expect(units.values(WEAPON_FLAGS, 40004)).toEqual([129]);
    expect(units.values(WEAPON_XP, 40004)).toEqual([90]);
    expect(units.values(EQUIP_WEAPON, 10000)).toEqual([4]);
    expect(units.values(EQUIP_WEAPON, 10001)).toEqual([5]);
    expect(units.values(WEAPON_KEY, 40000)).toEqual([hashId("")]);
    expect(units.values(WEAPON_FLAGS, 40000)).toEqual([0]);
  });

  it("moves the captains off the starting outfit with the start weapons", () => {
    const session = save({ chapter: 80 });
    fillSkippedStory(session);
    const units = reread(session);

    for (const captain of [10000, 10001]) {
      expect(units.of(captain).get(CHARACTER_OUTFIT)).toBe(0);
      expect(units.of(captain).get(CHARACTER_OUTFITS_OWNED)).toBe(1);
    }
  });

  it("keeps the starting outfit before the start weapons are due", () => {
    const units = reread(
      (() => {
        const session = save({ chapter: 60 });
        fillSkippedStory(session);
        return session;
      })(),
    );

    expect(units.of(10000).get(CHARACTER_OUTFIT)).toBe(1);
    expect(units.of(10000).get(CHARACTER_OUTFITS_OWNED)).toBe(2);
  });

  it("keeps other outfits a captain owns and wears", () => {
    const session = save({ chapter: 80 });
    session.patch([
      { attribute: CHARACTER_OUTFIT, entity: 10000, values: [2] },
      { attribute: CHARACTER_OUTFITS_OWNED, entity: 10000, values: [7] },
    ]);
    fillSkippedStory(session);
    const captain = reread(session).of(10000);

    expect(captain.get(CHARACTER_OUTFIT)).toBe(2);
    expect(captain.get(CHARACTER_OUTFITS_OWNED)).toBe(5);
  });

  it("keeps the outfit of a captain already holding the start weapon", () => {
    const session = save({ chapter: 80 });
    session.patch([
      { attribute: FIELD_NOTE_WEAPON_FLAGS, entity: 6, values: [4] },
    ]);
    fillSkippedStory(session);
    const captain = reread(session).of(10000);

    expect(captain.get(CHARACTER_OUTFIT)).toBe(1);
    expect(captain.get(CHARACTER_OUTFITS_OWNED)).toBe(2);
  });

  it("keeps a captain on another weapon and skips a start weapon once held", () => {
    const session = save({ chapter: 80 });
    session.patch([
      { attribute: EQUIP_WEAPON, entity: 10000, values: [2] },
      { attribute: FIELD_NOTE_WEAPON_FLAGS, entity: 7, values: [4] },
    ]);
    const added = fillSkippedStory(session);
    const units = reread(session);

    expect(added).toContain("WEP_PL0000_03");
    expect(added).not.toContain("WEP_PL0100_03");
    expect(units.values(EQUIP_WEAPON, 10000)).toEqual([2]);
    expect(units.values(EQUIP_WEAPON, 10001)).toEqual([3]);
    expect(units.values(WEAPON_ID, 40002)).toEqual([3]);
  });

  it("does nothing on a new save", () => {
    expect(fillSkippedStory(save({ chapter: -1 }))).toEqual([]);
  });

  it("keeps what the save already holds", () => {
    const session = save({ chapter: 200 });
    const at = session.save.slotData.units.of(0);
    const earned = [...at.get(TROPHY_EARNED)];
    earned[9] = true;
    const progress = [...at.get(TROPHY_PROGRESS)];
    progress[2] = 50n;
    progress[501] = 7n;
    session.patch([
      { attribute: TROPHY_EARNED, entity: 0, values: earned },
      { attribute: TROPHY_PROGRESS, entity: 0, values: progress },
      { attribute: ITEM_COUNT, entity: ITEM_ENTITY, values: [0] },
      { attribute: ITEM_ACQUIRED, entity: ITEM_ENTITY, values: [5] },
      { attribute: ARCHIVE_FLAGS, entity: NOTE_08_ENTITY, values: [3] },
    ]);

    const added = fillSkippedStory(session);
    const units = reread(session);

    expect(added).not.toContain("trophy 9");
    expect(added).not.toContain("ITEM_70_0004");
    expect(added).not.toContain("ARC_ROLANNOTE_08");
    expect(units.values(ITEM_COUNT, ITEM_ENTITY)).toEqual([0]);
    expect(units.of(0).get(TROPHY_PROGRESS)[2]).toBe(50n);
    expect(units.of(0).get(TROPHY_PROGRESS)[46]).toBe(5n);
    expect(units.of(0).get(TROPHY_PROGRESS)[501]).toBe(7n);
  });

  it("joins Id at the save's own level under a low-level crew", () => {
    const session = save({ crewLevel: 12 });
    fillSkippedStory(session);
    const units = reread(session);
    const id = units.of(ID_ENTITY);

    expect(units.values(CHARACTER_FLAGS, ID_ENTITY)).toEqual([9]);
    expect(id.get(CHARACTER_XP)).toBe(184474);
    expect(id.get(CHARACTER_LEVEL)).toBe(37);
    expect(id.get(CHARACTER_BASE_HP)).toBe(1107);
    expect(id.get(CHARACTER_BASE_ATTACK)).toBe(145);
    expect(id.get(EQUIP_SKILLS)).toEqual(
      ["01", "05", "02", "07"].map(skillHash),
    );
    for (const entity of Object.keys(SKILL_ENTITIES))
      expect(units.values(SKILL_FLAGS, Number(entity))).toEqual([1]);
    for (const offset of ID_MASTERY_OFFSETS)
      expect(
        units.values(MASTERY_NODE_BITS, ID_MASTERY_BLOCK + offset)![0],
      ).toBeGreaterThan(0);
    expect(units.of(0).get(TROPHY_PROGRESS)[714]).toBe(1n);
  });

  it.each([
    [40, 40, 222310, 1195, 157],
    [100, 42, 248461, 1254, 165],
  ])(
    "raises Id under a level %i crew to level %i",
    (crewLevel, level, xp, hp, attack) => {
      const session = save({ crewLevel });
      fillSkippedStory(session);
      const id = reread(session).of(ID_ENTITY);

      expect(id.get(CHARACTER_LEVEL)).toBe(level);
      expect(id.get(CHARACTER_XP)).toBe(xp);
      expect(id.get(CHARACTER_BASE_HP)).toBe(hp);
      expect(id.get(CHARACTER_BASE_ATTACK)).toBe(attack);
    },
  );

  it("only rejoins an Id the save already played", () => {
    const session = save({ idFlags: 8, idLevel: 39 });
    fillSkippedStory(session);
    const units = reread(session);
    const id = units.of(ID_ENTITY);

    expect(units.values(CHARACTER_FLAGS, ID_ENTITY)).toEqual([9]);
    expect(id.get(CHARACTER_LEVEL)).toBe(39);
    expect(units.values(MASTERY_NODE_BITS, ID_MASTERY_BLOCK)).toEqual([0]);
    expect(units.of(0).get(TROPHY_PROGRESS)[714]).toBe(0n);
  });

  it("leaves an Id already in the crew alone", () => {
    const session = save({ idFlags: 9, idLevel: 39, crewLevel: 100 });
    expect(fillSkippedStory(session)).not.toContain("PL1900");
    expect(reread(session).of(ID_ENTITY).get(CHARACTER_LEVEL)).toBe(39);
  });
});
