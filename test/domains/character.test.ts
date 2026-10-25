import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FIRST,
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_XP,
  CHARACTER_XP,
  masteryRange,
} from "../../src/domains/character/attributes";
import { maxCharacterLevel } from "../../src/domains/character/edit";
import {
  characterEntities,
  joinedCharacters,
  playableCharacters,
  readCaptain,
  readMasterLevel,
} from "../../src/domains/character/read";
import { SAVE_ENTITY, USER_CAPTAIN } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile, unitStore } from "../../src/testing";

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

describe("playableCharacters", () => {
  it("skips NPCs, unused rows and the captain not picked", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[USER_CAPTAIN, 2]],
      [CHARACTER_FIRST]: [[CHARACTER_KEY, hashId("PL0000")]],
      [CHARACTER_FIRST + 1]: [[CHARACTER_KEY, hashId("PL0100")]],
      [CHARACTER_FIRST + 2]: [[CHARACTER_KEY, hashId("PL0300")]],
      [CHARACTER_FIRST + 3]: [[CHARACTER_KEY, hashId("NP0000")]],
      [CHARACTER_FIRST + 4]: [[CHARACTER_KEY, hashId("SLOT01")]],
      [CHARACTER_FIRST + 5]: [[CHARACTER_KEY, hashId("PL000B")]],
    });
    expect(playableCharacters(units).map((c) => c.character)).toEqual([
      "PL0100",
      "PL0300",
    ]);
  });
});

describe("joinedCharacters", () => {
  it("keeps playable characters with bit 0 of 1305 set", () => {
    const units = unitStore({
      [CHARACTER_FIRST]: [
        [CHARACTER_KEY, hashId("PL0300")],
        [CHARACTER_FLAGS, 1],
      ],
      [CHARACTER_FIRST + 1]: [
        [CHARACTER_KEY, hashId("PL2600")],
        [CHARACTER_FLAGS, 0x10],
      ],
      [CHARACTER_FIRST + 2]: [
        [CHARACTER_KEY, hashId("NP0000")],
        [CHARACTER_FLAGS, 1],
      ],
    });
    expect(joinedCharacters(units).map((c) => c.character)).toEqual(["PL0300"]);
  });
});

describe("maxCharacterLevel", () => {
  const open = (key: string, level: number) =>
    SaveSession.open(
      fixtureFile({
        [CHARACTER_FIRST]: [
          [CHARACTER_KEY, hashId(key)],
          [CHARACTER_XP, 1000],
          [CHARACTER_LEVEL, level],
          [CHARACTER_BASE_HP, 150],
          [CHARACTER_BASE_ATTACK, 10],
        ],
      }),
    );

  it("sets XP, level and the chara_status HP and ATK of level 100", () => {
    const session = open("PL1500", 5);
    maxCharacterLevel(session, CHARACTER_FIRST);
    const at = session.save.slotData.units.of(CHARACTER_FIRST);
    expect([
      at.get(CHARACTER_XP),
      at.get(CHARACTER_LEVEL),
      at.get(CHARACTER_BASE_HP),
      at.get(CHARACTER_BASE_ATTACK),
    ]).toEqual([8400000, 100, 3739, 741]);
  });

  it("refuses a character at max level or with no level cap", () => {
    expect(() =>
      maxCharacterLevel(open("PL1500", 100), CHARACTER_FIRST),
    ).toThrow("already level 100");
    expect(() => maxCharacterLevel(open("NP0100", 1), CHARACTER_FIRST)).toThrow(
      "no max level",
    );
  });
});
