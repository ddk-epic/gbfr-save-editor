import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_HASH } from "../../src/core/keys";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  SIGIL_FIRST,
  SIGIL_FLAGS,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_LAST_ID,
  SIGIL_LEVEL,
  SIGIL_LIST_FLAGS,
} from "../../src/domains/sigil/attributes";
import { addSigil, editSigil } from "../../src/domains/sigil/edit";
import {
  sigilGem,
  sigilPrimaries,
  sigilSecondaries,
} from "../../src/domains/sigil/rolls";
import {
  findSigilById,
  readSigil,
  readSigils,
} from "../../src/domains/sigil/read";
import {
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_SIGIL,
  traitRange,
} from "../../src/domains/trait/attributes";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile, unitStore, type EntityUnits } from "../../src/testing";

/** The entity of a sigil's trait at one index. */
const traitAt = (sigil: number, index: number) =>
  traitRange(TRAIT_SIGIL + sigil - SIGIL_FIRST).first + index;

const trait = (key: number, level: number): EntityUnits => [
  [TRAIT_KEY, key],
  [TRAIT_LEVEL, level],
];

const SIGIL = SIGIL_FIRST + 4;

describe("readSigil", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reads a sigil with its two traits", () => {
    const units = unitStore({
      [SIGIL]: [
        [SIGIL_ID, 71],
        [SIGIL_KEY, hashId("GEEN_158_13")],
        [SIGIL_LEVEL, 15],
        [SIGIL_FLAGS, 1],
      ],
      [traitAt(SIGIL, 0)]: trait(hashId("SKILL_000_00"), 15),
      [traitAt(SIGIL, 1)]: trait(hashId("SKILL_001_00"), 10),
    });
    expect(readSigil(units, SIGIL)).toEqual({
      entity: SIGIL,
      id: 71,
      key: "GEEN_158_13",
      level: 15,
      primaryTrait: {
        entity: traitAt(SIGIL, 0),
        key: "SKILL_000_00",
        level: 15,
      },
      secondaryTrait: {
        entity: traitAt(SIGIL, 1),
        key: "SKILL_001_00",
        level: 10,
      },
      locked: true,
      seen: false,
    });
  });

  it("reads an empty trait slot as no trait", () => {
    const units = unitStore({
      [SIGIL]: [
        [SIGIL_ID, 71],
        [SIGIL_KEY, hashId("GEEN_158_13")],
      ],
      [traitAt(SIGIL, 0)]: trait(hashId("SKILL_000_00"), 15),
      [traitAt(SIGIL, 1)]: trait(EMPTY_HASH, 0),
    });
    expect(readSigil(units, SIGIL)?.secondaryTrait).toBeUndefined();
  });

  it("skips an entity whose id is 0 or whose key is empty", () => {
    const units = unitStore({
      [SIGIL]: [
        [SIGIL_ID, 0],
        [SIGIL_KEY, hashId("GEEN_158_13")],
      ],
      [SIGIL + 1]: [
        [SIGIL_ID, 72],
        [SIGIL_KEY, EMPTY_HASH],
      ],
    });
    expect(readSigil(units, SIGIL)).toBeUndefined();
    expect(readSigil(units, SIGIL + 1)).toBeUndefined();
    expect(readSigils(units).size).toBe(0);
  });

  it("keeps a key missing from the gem table as its hash", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const units = unitStore({
      [SIGIL]: [
        [SIGIL_ID, 71],
        [SIGIL_KEY, 0x12345678],
      ],
    });
    expect(readSigil(units, SIGIL)?.key).toBe("#12345678");
  });

  it("finds a sigil's entity by id", () => {
    const units = unitStore({
      [SIGIL]: [[SIGIL_ID, 71]],
      [SIGIL + 1]: [[SIGIL_ID, 72]],
    });
    expect(findSigilById(units, 72)).toBe(SIGIL + 1);
    expect(findSigilById(units, 73)).toBeUndefined();
  });
});

describe("addSigil and editSigil", () => {
  const entry = (entity: number, key: string, id: number, level: number) => ({
    [entity]: [
      [SIGIL_ID, id],
      [SIGIL_KEY, key ? hashId(key) : EMPTY_HASH],
      [SIGIL_LEVEL, level],
      [SIGIL_FLAGS, id ? 2 : 0],
    ] as EntityUnits,
    [traitAt(entity, 0)]: trait(key ? hashId("SKILL_000_00") : EMPTY_HASH, 1),
    [traitAt(entity, 1)]: trait(EMPTY_HASH, 1),
  });
  const open = () =>
    SaveSession.open(
      fixtureFile({
        0: [
          [SAVE_HASHSEED, 7],
          [SIGIL_LAST_ID, 40],
          [SIGIL_LIST_FLAGS, 6],
        ],
        ...entry(SIGIL_FIRST, "GEEN_000_24", 40, 15),
        // Stale level on an empty entry.
        ...entry(SIGIL_FIRST + 1, "", 0, 11),
        ...entry(SIGIL_FIRST + 2, "", 0, 0),
      }),
    );

  const roll = (
    level: number,
    secondary: string,
    primary = "SKILL_000_00",
  ) => ({ level, primary, secondary });
  const keyOf40 = (session: SaveSession) =>
    readSigils(session.save.slotData.units).get(40)!.key;

  it("adds to the first empty entry with the next id, both traits at its level", () => {
    const session = open();
    expect(addSigil(session, roll(13, "SKILL_069_00"))).toBe(41);
    const units = session.save.slotData.units;
    expect(readSigils(units).get(41)).toEqual({
      entity: SIGIL_FIRST + 1,
      id: 41,
      key: "GEEN_000_24",
      level: 13,
      primaryTrait: {
        entity: traitAt(SIGIL_FIRST + 1, 0),
        key: "SKILL_000_00",
        level: 13,
      },
      secondaryTrait: {
        entity: traitAt(SIGIL_FIRST + 1, 1),
        key: "SKILL_069_00",
        level: 13,
      },
      locked: false,
      seen: false,
    });
    expect(units.values(SIGIL_LAST_ID, 0)).toEqual([41]);
    expect(units.values(SIGIL_LIST_FLAGS, 0)).toEqual([7]);
  });

  it("picks the one-trait gem without a second trait, its entry empty at the level", () => {
    const session = open();
    addSigil(session, roll(15, "", "SKILL_044_00"));
    const units = session.save.slotData.units;
    expect(units.values(SIGIL_KEY, SIGIL_FIRST + 1)).toEqual([
      hashId("GEEN_044_04"),
    ]);
    expect(units.values(TRAIT_KEY, traitAt(SIGIL_FIRST + 1, 1))).toEqual([
      EMPTY_HASH,
    ]);
    expect(units.values(TRAIT_LEVEL, traitAt(SIGIL_FIRST + 1, 1))).toEqual([
      15,
    ]);
  });

  it("prefers the gem whose SkillId2 is the second trait", () => {
    expect(sigilGem(roll(11, "SKILL_006_00"))).toBe("GEEN_000_14");
  });

  it("rerolls in place, keeping the gem while it fits", () => {
    const session = open();
    editSigil(session, 40, roll(11, "SKILL_006_00"));
    expect(keyOf40(session)).toBe("GEEN_000_24");
    editSigil(session, 40, roll(15, ""));
    expect(keyOf40(session)).toBe("GEEN_000_04");
    editSigil(session, 40, roll(8, "SKILL_069_00"));
    expect(keyOf40(session)).toBe("GEEN_000_23");
    const sigil = readSigils(session.save.slotData.units).get(40)!;
    expect(sigil).toEqual(
      expect.objectContaining({ entity: SIGIL_FIRST, level: 8, seen: true }),
    );
    expect(session.save.slotData.units.values(SIGIL_LAST_ID, 0)).toEqual([40]);
  });

  it("offers a second trait only where the primary has a two-trait gem", () => {
    expect(sigilSecondaries("SKILL_044_00", 15)).toEqual([""]);
    expect(sigilSecondaries("SKILL_160_00", 15)[0]).not.toBe("");
    expect(sigilSecondaries("SKILL_000_00", 15)[0]).toBe("");
    expect(sigilSecondaries("SKILL_000_00", 15)).toContain("SKILL_069_00");
    expect(sigilPrimaries(15)).toContain("SKILL_044_00");
  });

  it("refuses a roll no gem fits and an unknown id", () => {
    const session = open();
    expect(() => addSigil(session, roll(16, ""))).toThrow(
      "no level 16 sigil of SKILL_000_00",
    );
    expect(() => addSigil(session, roll(15, "SKILL_999_00"))).toThrow(
      'second trait "SKILL_999_00"',
    );
    expect(() => addSigil(session, roll(1, "SKILL_069_00"))).toThrow(
      "no level 1 sigil",
    );
    expect(() => editSigil(session, 99, roll(15, ""))).toThrow(
      "no sigil with id 99",
    );
  });
});
