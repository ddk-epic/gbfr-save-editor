import { describe, expect, it } from "vitest";
import {
  CHARACTER_FIRST,
  CHARACTER_MASTER_XP,
} from "../../src/domains/character/attributes";
import { readMasterLevel } from "../../src/domains/character/read";
import { unitStore } from "../../src/testing";

describe("readMasterLevel", () => {
  it("gives the highest level the spent MSP pays for", () => {
    // Level 3 costs 6000 MSP in chara_master_exp.
    const level = (xp: number) =>
      readMasterLevel(
        unitStore({ [CHARACTER_FIRST]: [[CHARACTER_MASTER_XP, xp]] }),
        CHARACTER_FIRST,
      );
    expect(level(5999)).toBe(2);
    expect(level(6000)).toBe(3);
  });
});
