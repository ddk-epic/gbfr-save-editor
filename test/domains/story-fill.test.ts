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
  CHARACTER_XP,
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
import { fillSkippedStory } from "../../src/domains/story/fill";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
import { SAVE_HASHSEED, USER_CAPTAIN } from "../../src/domains/user/attributes";
import {
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "../../src/domains/weapon/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile } from "../../src/testing";

const ITEMS = [
  "ITEM_70_0004",
  "ITEM_70_0005",
  "ITEM_70_0006",
  "ITEM_70_0010",
] as const;
const ITEM_ENTITY = 300;
const ARCHIVES = [
  "ARC_OTHER_011",
  "ARC_OTHER_026",
  "ARC_OTHER_058",
  "ARC_OTHER_059",
  "ARC_OTHER_060",
  "ARC_ROLANNOTE_08",
] as const;
const ARCHIVE_ENTITY = 400;
const NOTE_08_ENTITY = ARCHIVE_ENTITY + 5;
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
      [USER_CAPTAIN, overrides.captain ?? 1],
    ],
    ...Object.fromEntries(
      ITEMS.map((item, index) => [
        ITEM_ENTITY + index,
        [
          [ITEM_KEY, hashId(item)],
          [ITEM_COUNT, 0],
          [ITEM_FLAGS, 0],
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
    10000: [
      [CHARACTER_KEY, hashId("PL0000")],
      [CHARACTER_FLAGS, 1],
      [CHARACTER_LEVEL, overrides.crewLevel ?? 1],
      [EQUIP_WEAPON, 1],
    ],
    10001: [
      [CHARACTER_KEY, hashId("PL0100")],
      [CHARACTER_FLAGS, 1],
      [CHARACTER_LEVEL, 1],
      [EQUIP_WEAPON, 3],
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
    for (const trophy of [1, 1405, 9, 1413, 11, 1397])
      expect(at.get(TROPHY_EARNED)[trophy]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[2]).toBe(38n);
    expect(at.get(TROPHY_PROGRESS)[501]).toBe(10n);
    expect(at.get(TROPHY_PROGRESS)[1018]).toBe(10n);

    expect(units.values(ITEM_COUNT, ITEM_ENTITY)).toEqual([1]);
    expect(units.values(ITEM_FLAGS, ITEM_ENTITY)).toEqual([4]);
    expect(units.values(ITEM_FLAGS, ITEM_ENTITY + 3)).toEqual([36]);
    expect(units.values(ITEM_ACQUIRED, ITEM_ENTITY)).toEqual([8]);
    expect(units.values(ITEM_ACQUIRED, ITEM_ENTITY + 3)).toEqual([11]);
    expect(at.get(ITEM_ACQUIRED_LAST)).toBe(11);

    for (let index = 0; index < ARCHIVES.length - 1; index++)
      expect(units.values(ARCHIVE_FLAGS, ARCHIVE_ENTITY + index)).toEqual([1]);
    expect(units.values(ARCHIVE_FLAGS, NOTE_08_ENTITY)).toEqual([3]);
    expect(at.get(TROPHY_PROGRESS)[46]).toBe(6n);
    expect(at.get(TROPHY_PROGRESS)[47]).toBe(6n);

    expect(
      at.get(UI_FEATURE_UNLOCKED).flatMap((on, index) => (on ? [index] : [])),
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(at.get(WEAPON_LAST_ID)).toBe(7);
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
    expect(units.values(WEAPON_ID, 40000)).toEqual([0]);
    expect(units.values(WEAPON_ID, 40001)).toEqual([2]);
    expect(units.values(WEAPON_ID, 40002)).toEqual([0]);
    for (const note of [6, 7, 34, 35])
      expect(units.values(FIELD_NOTE_WEAPON_FLAGS, note)).toEqual([4]);
    expect(units.values(EQUIP_WEAPON, 10000)).toEqual([4]);
    expect(units.values(EQUIP_WEAPON, 10001)).toEqual([7]);
  });

  it("changes nothing on a second run", () => {
    const session = save();
    fillSkippedStory(session);
    const first = session.export();
    expect(fillSkippedStory(session)).toEqual([]);
    expect(session.export()).toEqual(first);
  });

  it("stops at the save's current chapter", () => {
    const session = save({ chapter: 80 });
    expect(fillSkippedStory(session)).toEqual([
      "trophy 1",
      "trophy 1405",
      "UI feature 7",
      "trophy 2",
      "trophy 1406",
      "ITEM_70_0004",
      "trophy 3",
      "trophy 1407",
      "ITEM_70_0005",
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
    expect(units.of(0).get(TROPHY_PROGRESS)[501]).toBe(15n);
  });

  it("joins Id at the save's own level under a low-level crew", () => {
    const session = save({ crewLevel: 12 });
    fillSkippedStory(session);
    const units = reread(session);
    const id = units.of(ID_ENTITY);

    expect(id.get(CHARACTER_FLAGS)).toBe(9);
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

    expect(id.get(CHARACTER_FLAGS)).toBe(9);
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
