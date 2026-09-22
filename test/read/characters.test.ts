import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  masteryRange,
} from "../../src/domains/character/attributes";
import {
  EQUIP_CHARACTER,
  LOADOUT_FIRST,
  LOADOUT_NAME,
} from "../../src/domains/equipment/attributes";
import {
  OVER_MASTERY_KEY,
  OVER_MASTERY_LEVEL,
  OVER_MASTERY_LINES,
} from "../../src/domains/over-mastery/attributes";
import {
  PARTY_CHARACTER,
  PARTY_FIRST,
  PARTY_POSITIONS,
  PARTY_SET_COUNT,
  PARTY_SET_FIRST,
  PARTY_SET_STRIDE,
} from "../../src/domains/party/attributes";
import {
  SUMMON_ID,
  SUMMON_KEY,
  SUMMON_POSITIONS,
  SUMMONS_EQUIPPED,
} from "../../src/domains/summon/attributes";
import { UNLOCK_KEY, UNLOCK_VALUE } from "../../src/domains/unlock/attributes";
import { SAVE_ENTITY, USER_CAPTAIN } from "../../src/domains/user/attributes";
import { readCharacterData } from "../../src/read/characters";
import { unitStore } from "../../src/testing";

const GRAN = CHARACTER_FIRST;
const KATALINA = CHARACTER_FIRST + 1;
/** Katalina's mastery block: over-mastery lines and master trait cells. */
const KATALINA_MASTERY = masteryRange(KATALINA).first;

const OVER_MASTERY = "LBP_AB_PL1100_01";
/** SB_ATK r3, order 133, not a perk. */
const MASTER_TRAIT_HASH = 0x00440979;
// The summon table names unresolved keys in hex; the save stores the hash.
const SUMMON_HASH = 0x0033943a;

const units = unitStore({
  [SAVE_ENTITY]: [
    [USER_CAPTAIN, 1],
    // Summon id 9 in the second position, the rest empty.
    [SUMMONS_EQUIPPED, [0, 9, 0, 0]],
  ],
  9: [
    [SUMMON_ID, 9],
    [SUMMON_KEY, SUMMON_HASH],
  ],
  [GRAN]: [
    [CHARACTER_KEY, hashId("PL0000")],
    [CHARACTER_LEVEL, 100],
  ],
  [KATALINA]: [
    [CHARACTER_KEY, hashId("PL0300")],
    [CHARACTER_LEVEL, 80],
  ],
  [KATALINA_MASTERY]: [
    [OVER_MASTERY_KEY, hashId(OVER_MASTERY)],
    // Level 3, stored as the single bit 1 << 2.
    [OVER_MASTERY_LEVEL, 4],
  ],
  [KATALINA_MASTERY + OVER_MASTERY_LINES]: [
    [UNLOCK_KEY, MASTER_TRAIT_HASH],
    [UNLOCK_VALUE, 1],
  ],
  [PARTY_FIRST]: [[PARTY_CHARACTER, hashId("PL0000")]],
  [PARTY_FIRST + 1]: [[PARTY_CHARACTER, hashId("PL0300")]],
  // Party set 1, first member only.
  [PARTY_SET_FIRST + PARTY_SET_STRIDE]: [[EQUIP_CHARACTER, hashId("PL0000")]],
  [LOADOUT_FIRST]: [
    [EQUIP_CHARACTER, hashId("PL0300")],
    [LOADOUT_NAME, [66, 0]],
  ],
});

describe("readCharacterData", () => {
  const data = readCharacterData(units);

  it("reads a character per gear entity, in save order", () => {
    expect(data.characters.map((c) => [c.character, c.level])).toEqual([
      ["PL0000", 100],
      ["PL0300", 80],
    ]);
    expect(data.captain).toBe("PL0000");
  });

  it("reads the party and summons at a fixed width", () => {
    expect(data.party).toEqual([
      "PL0000",
      "PL0300",
      ...Array(PARTY_POSITIONS - 2).fill(undefined),
    ]);
    expect(data.summons.map((summon) => summon?.key)).toEqual([
      undefined,
      "0033943A",
      ...Array(SUMMON_POSITIONS - 2).fill(undefined),
    ]);
  });

  it("reads only loadouts naming a character", () => {
    expect(data.loadouts.map((l) => [l.character, l.name])).toEqual([
      ["PL0300", "B"],
    ]);
  });

  it("reads party sets at a fixed width, undefined where none is saved", () => {
    expect(data.partySets).toHaveLength(PARTY_SET_COUNT);
    expect(data.partySets[0]).toBeUndefined();
    // Positions a set does not fill read as undefined.
    expect(data.partySets[1]?.map((member) => member?.character)).toEqual([
      "PL0000",
      ...Array(PARTY_POSITIONS - 1).fill(undefined),
    ]);
  });

  it("reads over-masteries and master trait cells off the mastery block", () => {
    const katalina = data.characters[1]!;
    expect(katalina.overMasteries[0]).toEqual({
      entity: KATALINA_MASTERY,
      key: OVER_MASTERY,
      level: 3,
    });
    expect(katalina.overMasteries.slice(1)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(
      katalina.masterTraits.map(({ style, rank, order, chosen }) => ({
        style,
        rank,
        order,
        chosen,
      })),
    ).toEqual([{ style: "SB_ATK", rank: "r3", order: 133, chosen: true }]);
  });

  it("gives a character with no mastery units empty progress", () => {
    const gran = data.characters[0]!;
    expect(gran.masterTraits).toEqual([]);
    expect(gran.overMasteries).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(gran.fateEpisodes).toEqual([]);
    expect(gran.masteries.offense.taken).toBe(0);
  });
});
