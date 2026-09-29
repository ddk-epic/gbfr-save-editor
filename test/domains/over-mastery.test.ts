import { describe, expect, it } from "vitest";
import { EMPTY_HASH } from "../../src/core/keys";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
  masteryRange,
} from "../../src/domains/character/attributes";
import {
  OVER_MASTERY_KEY,
  OVER_MASTERY_LEVEL,
} from "../../src/domains/over-mastery/attributes";
import { removeOverMasteries } from "../../src/domains/over-mastery/edit";
import { readOverMasteries } from "../../src/domains/over-mastery/read";
import { validateOverMasteries } from "../../src/domains/over-mastery/validate";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile, unitStore, type EntityUnits } from "../../src/testing";

describe("readOverMasteries", () => {
  it("gives each line's value at its roll level", () => {
    const mastery = masteryRange(CHARACTER_FIRST);
    const line = (key: number, level: number): EntityUnits => [
      [OVER_MASTERY_KEY, key],
      [OVER_MASTERY_LEVEL, 1 << (level - 1)],
    ];
    const units = unitStore({
      [mastery.first]: line(hashId("MED_EFF_ATK01"), 3),
      [mastery.first + 1]: line(hashId("MED_EFF_BREAK01"), 10),
      [mastery.first + 2]: line(0x12345678, 5),
    });
    expect(
      readOverMasteries(units, mastery).map((l) => l && [l.key, l.value]),
    ).toEqual([
      ["MED_EFF_ATK01", 200],
      ["MED_EFF_BREAK01", 20],
      ["#12345678", undefined],
      undefined,
    ]);
  });
});

describe("validateOverMasteries", () => {
  it("passes levels up to 10 and unrolled lines", () => {
    expect(
      validateOverMasteries("PL0000", [
        { entity: 1, key: "MED_EFF_01", level: 1, value: undefined },
        { entity: 2, key: "MED_EFF_02", level: 10, value: undefined },
        undefined,
        undefined,
      ]),
    ).toEqual([]);
  });

  it("rejects a level past 10", () => {
    expect(
      validateOverMasteries("PL0000", [
        { entity: 1, key: "MED_EFF_01", level: 11, value: undefined },
      ]),
    ).toEqual([
      {
        severity: "reject",
        code: "overMasteryOverMax",
        character: "PL0000",
        entity: 1,
        level: 11,
      },
    ]);
  });
});

describe("removeOverMasteries", () => {
  const CHARACTER = CHARACTER_FIRST + 7;
  const mastery = masteryRange(CHARACTER);

  const lines = (character: number, keys: string[]) =>
    Object.fromEntries(
      keys.map((key, i): [number, EntityUnits] => [
        masteryRange(character).first + i,
        [
          [OVER_MASTERY_KEY, key === "" ? EMPTY_HASH : hashId(key)],
          [OVER_MASTERY_LEVEL, key === "" ? 0 : 1 << i],
        ],
      ]),
    );

  const rolled = [
    "MED_EFF_ATK01",
    "MED_EFF_HP01",
    "MED_EFF_BREAK01",
    "MED_EFF_CRITICAL01",
  ];

  it("empties all four lines of that character only", () => {
    const session = SaveSession.open(
      fixtureFile({
        [CHARACTER]: [[CHARACTER_KEY, hashId("PL1900")]],
        [CHARACTER + 1]: [[CHARACTER_KEY, hashId("PL2000")]],
        ...lines(CHARACTER, rolled),
        ...lines(CHARACTER + 1, rolled),
      }),
    );
    removeOverMasteries(session, CHARACTER);
    const units = session.save.slotData.units;
    expect(readOverMasteries(units, mastery)).toEqual(Array(4).fill(undefined));
    for (let i = 0; i < 4; i++)
      expect(units.values(OVER_MASTERY_LEVEL, mastery.first + i)).toEqual([0]);
    expect(
      readOverMasteries(units, masteryRange(CHARACTER + 1)).map((l) => l?.key),
    ).toEqual(rolled);
  });

  it("refuses a character without an Over Mastery", () => {
    const session = SaveSession.open(
      fixtureFile({
        [CHARACTER]: [[CHARACTER_KEY, hashId("PL1900")]],
        ...lines(CHARACTER, ["", "", "", ""]),
      }),
    );
    expect(() => removeOverMasteries(session, CHARACTER)).toThrow(
      "has no Over Mastery",
    );
    expect(() => removeOverMasteries(session, CHARACTER + 1)).toThrow(
      "no character at",
    );
  });
});
