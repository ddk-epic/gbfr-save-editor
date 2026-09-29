import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
  CHARACTER_MASTER_XP,
  masteryRange,
} from "../../src/domains/character/attributes";
import {
  characterEntities,
  readCaptain,
  readMasterLevel,
} from "../../src/domains/character/read";
import { SAVE_ENTITY, USER_CAPTAIN } from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

describe("characterEntities", () => {
  it("gives each character's id with its coordinates, skipping empty entities", () => {
    const units = unitStore({
      [CHARACTER_FIRST]: [[CHARACTER_KEY, hashId("PL0300")]],
      [CHARACTER_FIRST + 1]: [[CHARACTER_KEY, hashId("")]],
    });
    expect(characterEntities(units)).toEqual([
      {
        character: "PL0300",
        gear: CHARACTER_FIRST,
        mastery: masteryRange(CHARACTER_FIRST),
      },
    ]);
  });
});

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

describe("readCaptain", () => {
  it("maps 1103 to Gran or Djeeta, undefined when unset", () => {
    const captain = (value?: number) =>
      readCaptain(
        unitStore(
          value === undefined ? {} : { [SAVE_ENTITY]: [[USER_CAPTAIN, value]] },
        ),
      );
    expect(captain(1)).toBe("PL0000");
    expect(captain(2)).toBe("PL0100");
    expect(captain()).toBeUndefined();
  });
});
