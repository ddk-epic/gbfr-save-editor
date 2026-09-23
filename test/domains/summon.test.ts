import { describe, expect, it } from "vitest";
import {
  SUMMONS_EQUIPPED,
  SUMMON_ID,
  SUMMON_KEY,
} from "../../src/domains/summon/attributes";
import { readEquippedSummons } from "../../src/domains/summon/read";
import { SAVE_ENTITY } from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

// The summon table names unresolved keys in hex; the save stores the hash.
const SUMMON_HASH = 0x0033943a;

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
