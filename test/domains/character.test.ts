import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FIRST,
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_BREAK_MARKS,
  CHARACTER_MASTER_XP,
  CHARACTER_XP,
  masteryRange,
} from "../../src/domains/character/attributes";
import {
  maxCharacterLevel,
  maxMasterLevel,
} from "../../src/domains/character/edit";
import {
  characterEntities,
  joinedCharacters,
  playableCharacters,
  readCaptain,
  readMasterLevel,
} from "../../src/domains/character/read";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
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

describe("maxMasterLevel", () => {
  const open = (key: string, masterXp: number, marks: number[]) =>
    SaveSession.open(
      fixtureFile({
        [SAVE_ENTITY]: [
          [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
          [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
        ],
        [CHARACTER_FIRST]: [
          [CHARACTER_KEY, hashId(key)],
          [CHARACTER_FLAGS, 0x4001],
          [CHARACTER_MASTER_XP, masterXp],
          [CHARACTER_MASTER_BREAK_MARKS, marks],
        ],
      }),
    );

  it("sets master level 55 with the cap break marks and badges, MSP untouched", () => {
    const session = open("PL0200", 0, [0, 2]);
    maxMasterLevel(session, CHARACTER_FIRST);
    const units = session.save.slotData.units;
    const at = units.of(CHARACTER_FIRST);
    expect(at.get(CHARACTER_MASTER_XP)).toBe(3309499);
    expect(at.get(CHARACTER_FLAGS)).toBe(0x6001);
    expect(at.get(CHARACTER_MASTER_BREAK_MARKS)).toEqual([5, 2]);

    const earned = units.of(SAVE_ENTITY).get(TROPHY_EARNED);
    const progress = units.of(SAVE_ENTITY).get(TROPHY_PROGRESS);
    expect(earned.flatMap((e, i) => (e ? [i] : []))).toEqual([
      846, 855, 856, 857, 858, 859, 860, 861, 862, 1464, 1465,
    ]);
    expect([
      progress[650],
      progress[654],
      progress[655],
      progress[656],
    ]).toEqual([0n, 50n, 0n, 0n]);
    expect([progress[1053], progress[1054]]).toEqual([50n, 5n]);
  });

  it("refuses a character at master level 55 or with no master level", () => {
    expect(() =>
      maxMasterLevel(open("PL0200", 3309499, [0, 0]), CHARACTER_FIRST),
    ).toThrow("already master level 55");
    expect(() =>
      maxMasterLevel(open("NP0100", 0, [0, 0]), CHARACTER_FIRST),
    ).toThrow("no master level");
  });
});
