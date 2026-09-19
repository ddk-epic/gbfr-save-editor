import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_HASH } from "../src/core/keys";
import { hashId } from "../src/core/xxhash32-custom";
import {
  SIGIL_FIRST,
  SIGIL_FLAGS,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_LEVEL,
} from "../src/domains/sigil/attributes";
import {
  findSigilById,
  readSigil,
  readSigils,
} from "../src/domains/sigil/read";
import {
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_SIGIL,
  traitRange,
} from "../src/domains/trait/attributes";
import { unitStore, type EntityUnits } from "./fixture";

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
