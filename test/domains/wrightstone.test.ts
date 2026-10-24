import { describe, expect, it } from "vitest";
import { EMPTY_HASH } from "../../src/core/keys";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_KEY,
} from "../../src/domains/item/attributes";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_STRIDE,
  TRAIT_WRIGHTSTONE,
} from "../../src/domains/trait/attributes";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import {
  WRIGHTSTONE_FIRST,
  WRIGHTSTONE_ID,
  WRIGHTSTONE_KEY,
  WRIGHTSTONE_LAST_ID,
} from "../../src/domains/wrightstone/attributes";
import {
  addWrightstone,
  editWrightstone,
} from "../../src/domains/wrightstone/edit";
import { readWrightstones } from "../../src/domains/wrightstone/read";
import {
  wrightstoneRoll,
  type WrightstoneRoll,
} from "../../src/domains/wrightstone/rolls";
import { validateWrightstone } from "../../src/domains/wrightstone/validate";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile, type EntityUnits } from "../../src/testing";

const stone = (...levels: number[]) => ({
  key: "ITEM_28_0000",
  traits: levels.map((level, i) => ({ entity: i, key: "SKILL", level })),
});

describe("validateWrightstone", () => {
  it("passes up to three traits in descending level", () => {
    expect(validateWrightstone("wrightstone", 1, stone(20, 10, 10))).toEqual(
      [],
    );
  });

  it("rejects more than three traits", () => {
    expect(validateWrightstone("weapon", 7, stone(20, 10, 5, 1))).toEqual([
      {
        severity: "reject",
        code: "tooManyTraits",
        holder: "weapon",
        id: 7,
        count: 4,
        max: 3,
      },
    ]);
  });

  it("rejects a loose stone's traits out of order, not a welded one's", () => {
    expect(validateWrightstone("wrightstone", 1, stone(10, 20))).toEqual([
      {
        severity: "reject",
        code: "traitsNotDescending",
        holder: "wrightstone",
        id: 1,
      },
    ]);
    expect(validateWrightstone("weapon", 7, stone(10, 20))).toEqual([]);
  });
});

describe("wrightstone rolls", () => {
  it("reads a stone's roll back, none for a lower tier or other levels", () => {
    const traits = (main: string, ...levels: number[]) =>
      [main, "SKILL_027_00", "SKILL_027_00"].map((key, i) => ({
        entity: i,
        key,
        level: levels[i]!,
      }));
    expect(
      wrightstoneRoll("ITEM_26_0130", traits("SKILL_003_00", 10, 7, 5)),
    ).toEqual({
      family: 26,
      preset: "low",
      subs: ["SKILL_027_00", "SKILL_027_00"],
    });
    expect(
      wrightstoneRoll("ITEM_26_0130", traits("SKILL_003_00", 15, 7, 5)),
    ).toBeUndefined();
    expect(
      wrightstoneRoll("ITEM_26_0012", traits("SKILL_003_00", 10, 7, 5)),
    ).toBeUndefined();
  });
});

describe("addWrightstone and editWrightstone", () => {
  const traitsOf = (stone: number) =>
    TRAIT_FIRST +
    (TRAIT_WRIGHTSTONE + stone - WRIGHTSTONE_FIRST) * TRAIT_STRIDE;
  const stone = (entity: number, key: string, id: number) => ({
    [entity]: [
      [WRIGHTSTONE_KEY, key ? hashId(key) : EMPTY_HASH],
      [WRIGHTSTONE_ID, id],
    ] as EntityUnits,
    ...Object.fromEntries(
      [0, 1, 2].map((i) => [
        traitsOf(entity) + i,
        [
          [TRAIT_KEY, key ? hashId("SKILL_000_00") : EMPTY_HASH],
          [TRAIT_LEVEL, key ? 1 : 0],
        ] as EntityUnits,
      ]),
    ),
  });
  const item = (key: string, count: number): EntityUnits => [
    [ITEM_KEY, key ? hashId(key) : EMPTY_HASH],
    [ITEM_COUNT, count],
    [ITEM_ACQUIRED, count ? 3 : 0],
  ];
  const open = () =>
    SaveSession.open(
      fixtureFile({
        0: [
          [SAVE_HASHSEED, 7],
          [WRIGHTSTONE_LAST_ID, 40],
          [ITEM_ACQUIRED_LAST, 10],
          ...item("ITEM_26_0131", 1),
        ],
        1: item("", 0),
        ...stone(WRIGHTSTONE_FIRST, "ITEM_26_0131", 40),
        ...stone(WRIGHTSTONE_FIRST + 1, "", 0),
        ...stone(WRIGHTSTONE_FIRST + 2, "", 0),
      }),
    );
  const roll: WrightstoneRoll = {
    family: 28,
    preset: "high",
    subs: ["SKILL_151_00", "SKILL_151_00"],
  };

  it("adds to the first empty entry, with the next id and item counters", () => {
    const session = open();
    expect(addWrightstone(session, roll)).toBe(41);
    const units = session.save.slotData.units;
    expect(readWrightstones(units).get(41)).toEqual(
      expect.objectContaining({
        entity: WRIGHTSTONE_FIRST + 1,
        key: "ITEM_28_0130",
        locked: false,
        seen: false,
        traits: [
          expect.objectContaining({ key: "SKILL_014_00", level: 15 }),
          expect.objectContaining({ key: "SKILL_151_00", level: 10 }),
          expect.objectContaining({ key: "SKILL_151_00", level: 7 }),
        ],
      }),
    );
    expect(units.values(WRIGHTSTONE_LAST_ID, 0)).toEqual([41]);
    expect(units.values(ITEM_KEY, 1)).toEqual([hashId("ITEM_28_0130")]);
    expect(units.values(ITEM_COUNT, 1)).toEqual([1]);
    expect(units.values(ITEM_ACQUIRED, 1)).toEqual([11]);
    expect(units.values(ITEM_ACQUIRED_LAST, 0)).toEqual([11]);
  });

  it("rerolls in place, moving the item count when the key changes", () => {
    const session = open();
    editWrightstone(session, 40, { ...roll, family: 26 });
    const units = session.save.slotData.units;
    const edited = readWrightstones(units).get(40)!;
    expect(edited.entity).toBe(WRIGHTSTONE_FIRST);
    expect(edited.key).toBe("ITEM_26_0130");
    expect(edited.traits.map((t) => [t.key, t.level])).toEqual([
      ["SKILL_003_00", 15],
      ["SKILL_151_00", 10],
      ["SKILL_151_00", 7],
    ]);
    expect(units.values(ITEM_COUNT, 0)).toEqual([0]);
    expect(units.values(ITEM_COUNT, 1)).toEqual([1]);
    expect(units.values(WRIGHTSTONE_LAST_ID, 0)).toEqual([40]);
  });

  it("refuses a sub the family cannot roll and an unknown id", () => {
    const session = open();
    expect(() =>
      addWrightstone(session, {
        ...roll,
        subs: ["SKILL_014_00", "SKILL_000_00"],
      }),
    ).toThrow("cannot roll sub trait SKILL_014_00");
    expect(() => editWrightstone(session, 99, roll)).toThrow(
      "no wrightstone with id 99",
    );
  });
});
