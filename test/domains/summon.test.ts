import { describe, expect, it } from "vitest";
import {
  SUMMONS_EQUIPPED,
  SUMMON_ID,
  SUMMON_KEY,
  SUMMON_LEVELS,
  SUMMON_TRAIT_AND_BONUS,
} from "../../src/domains/summon/attributes";
import { readEquippedSummons, readSummon } from "../../src/domains/summon/read";
import { SAVE_ENTITY } from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

// The summon table names unresolved keys in hex; the save stores the hash.
const SUMMON_HASH = 0x0033943a;

describe("readSummon", () => {
  it("gives the equip bonus value at its level", () => {
    const bonus = (hash: number, level: number) =>
      readSummon(
        unitStore({
          0: [
            [SUMMON_ID, 1],
            [SUMMON_KEY, SUMMON_HASH],
            [SUMMON_TRAIT_AND_BONUS, [0, hash]],
            [SUMMON_LEVELS, [0, level]],
          ],
        }),
        0,
      )?.equipBonus;
    // Stun Power, stored at a tenth of its display.
    expect(bonus(0xf7b0316f, 1)).toEqual({
      key: "F7B0316F",
      level: 1,
      value: 3,
    });
    expect(bonus(0xa3e537b1, 9)?.value).toBe(3000);
    expect(bonus(0x12345678, 0)?.value).toBeUndefined();
  });
});

describe("readEquippedSummons", () => {
  it("resolves each position's id to its summon, without the summon list", () => {
    const units = unitStore({
      // Id 9 behind a summon, id 12 with none, two empty positions.
      [SAVE_ENTITY]: [[SUMMONS_EQUIPPED, [0, 9, 12, 0]]],
      5: [
        [SUMMON_ID, 9],
        [SUMMON_KEY, SUMMON_HASH],
      ],
    });
    expect(readEquippedSummons(units).map((s) => s?.entity)).toEqual([
      undefined,
      5,
      undefined,
      undefined,
    ]);
  });
});
