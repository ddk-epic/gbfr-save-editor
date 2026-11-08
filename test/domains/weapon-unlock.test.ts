import { describe, expect, it } from "vitest";
import { hashId } from "../../packages/core/xxhash32-custom";
import { WEAPON_ROWS } from "../../packages/weapon/data.gen";
import { WEAPONS_HELD_ALL_BADGES } from "../../packages/trophy/data.gen";
import {
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CAPTAIN,
} from "../../packages/character/attributes";
import {
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
} from "../../packages/journal/attributes";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../packages/trophy/attributes";
import { SAVE_ENTITY } from "../../packages/core/save-entity";
import {
  canMaxAllWeaponSeries,
  canMaxWeaponSeries,
  canUnlockAllWeaponSeries,
  maxAllWeaponSeries,
  maxWeaponSeries,
  unlockAllWeaponSeries,
  unlockWeapon,
  unlockWeaponSeries,
} from "../../packages/workflows/weapon";
import {
  unlockableWeapons,
  readOwnedWeapons,
  readWeapons,
} from "../../packages/weapon/read";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "../../packages/weapon/attributes";
import { SaveSession } from "../../packages/core/session";
import { fixtureFile } from "../../packages/gbfr-save-editor/testing";

const CHARACTER = 10000;
const NOTE = 700;
const LAST_XP = 162540;
const ENTRIES = 12;

const open = (
  character: string,
  held: readonly (readonly [key: string, xp: number, uncap: number])[],
  options: {
    flags?: number;
    note?: string;
    noteFlags?: number;
    /** Characters at the entities after `CHARACTER`. */
    others?: string[];
  } = {},
) => {
  const counts = Array<bigint>(1200).fill(0n);
  const rows = Array.from(
    { length: ENTRIES },
    (_, i) => held[i] ?? (["", 0, 0] as const),
  );
  return SaveSession.open(
    fixtureFile({
      [SAVE_ENTITY]: [
        [CAPTAIN, 1],
        [WEAPON_LAST_ID, 50],
        [TROPHY_PROGRESS, counts],
        [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
      ],
      [CHARACTER]: [
        [CHARACTER_KEY, hashId(character)],
        [CHARACTER_FLAGS, options.flags ?? 1],
      ],
      ...Object.fromEntries(
        (options.others ?? []).map((other, i) => [
          CHARACTER + 1 + i,
          [
            [CHARACTER_KEY, hashId(other)],
            [CHARACTER_FLAGS, 1],
          ],
        ]),
      ),
      [NOTE]: [
        [FIELD_NOTE_WEAPON_KEY, hashId(options.note ?? "")],
        [FIELD_NOTE_WEAPON_FLAGS, options.noteFlags ?? 0],
      ],
      ...Object.fromEntries(
        rows.map(([key, xp, uncap], index) => [
          WEAPON_FIRST + index,
          [
            [WEAPON_ID, key ? index + 1 : 0],
            [WEAPON_KEY, key ? hashId(key) : hashId("")],
            [WEAPON_XP, xp],
            [WEAPON_UNCAP, uncap],
            [WEAPON_FLAGS, key ? 129 : 0],
          ],
        ]),
      ),
    }),
  );
};
const units = (session: SaveSession) => session.save.slotData.units;
const progress = (session: SaveSession) =>
  units(session).of(SAVE_ENTITY).get(TROPHY_PROGRESS);
const earned = (session: SaveSession) =>
  units(session).of(SAVE_ENTITY).get(TROPHY_EARNED);
const added = (session: SaveSession, key: string) =>
  [...readWeapons(units(session)).values()].find((w) => w.key === key)!;
const keys = (session: SaveSession) =>
  unlockableWeapons(units(session), CHARACTER).map(({ key }) => key);

describe("WEAPON_ROWS forged", () => {
  it("adds up to what the all weapons trophy needs, one captain counted", () => {
    const forged = Object.values(WEAPON_ROWS).filter(
      ({ forged, character }) => forged && character !== "PL0100",
    );
    expect(forged).toHaveLength(WEAPONS_HELD_ALL_BADGES[0]![1]);
  });

  it("picks the blacksmith's row over a starter and skips the variants", () => {
    expect(WEAPON_ROWS.WEP_PL0000_01_01!.forged).toEqual([3, 65]);
    expect(WEAPON_ROWS.WEP_PL0000_01!.forged).toBeUndefined();
    expect(WEAPON_ROWS.WEP_PL0000_06_01!.forged).toBeUndefined();
    expect(WEAPON_ROWS.WEP_PL0000_06!.forged).toEqual([6, 1]);
    expect(WEAPON_ROWS.WEP_PL0200_01!.forged).toEqual([0, 1]);
  });
});

describe("unlockableWeapons", () => {
  it("lists the missing series in list order", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 0, 0]]);
    expect(keys(session)).toEqual([
      "WEP_PL0000_01_01",
      "WEP_PL0000_03",
      "WEP_PL0000_04",
      "WEP_PL0000_05",
      "WEP_PL0000_06",
    ]);
  });

  it("takes a held starter as its series", () => {
    const session = open("PL0000", [["WEP_PL0000_01", 0, 0]]);
    expect(keys(session)).not.toContain("WEP_PL0000_01_01");
  });

  it("lists only the series a later character has", () => {
    expect(keys(open("PL2100", []))).toHaveLength(4);
  });

  it("lists nothing on the captain not in play", () => {
    expect(keys(open("PL0100", []))).toEqual([]);
  });

  it("lists a character not yet joined", () => {
    expect(keys(open("PL0200", [], { flags: 0 }))).toHaveLength(6);
  });
});

describe("unlockWeapon", () => {
  it("writes the forged state in the first free entry with the next id", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 790, 2]]);
    unlockWeapon(session, CHARACTER, "WEP_PL0000_04");
    const weapon = added(session, "WEP_PL0000_04");
    expect(weapon.entity).toBe(WEAPON_FIRST + 1);
    expect(weapon.id).toBe(51);
    expect(weapon.uncap).toBe(3);
    expect(weapon.xp).toBe(5340);
    expect(units(session).values(WEAPON_FLAGS, weapon.entity)).toEqual([128]);
    expect(units(session).of(SAVE_ENTITY).get(WEAPON_LAST_ID)).toBe(51);
  });

  it("adds the field note's bit and keeps the rest", () => {
    const session = open("PL0000", [], {
      note: "WEP_PL0000_04",
      noteFlags: 1,
    });
    unlockWeapon(session, CHARACTER, "WEP_PL0000_04");
    expect(units(session).values(FIELD_NOTE_WEAPON_FLAGS, NOTE)).toEqual([5]);
  });

  it("recounts held weapons, levels and the Collection", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 790, 2]]);
    unlockWeapon(session, CHARACTER, "WEP_PL0000_04");
    expect(progress(session)[184]).toBe(2n);
    expect(progress(session)[998]).toBe(2n);
    expect(progress(session)[185]).toBe(105n);
    expect(progress(session)[150]).toBe(2n);
    expect(progress(session)[186]).toBe(0n);
    expect(progress(session)[225]).toBe(0n);
  });

  it("leaves a character not yet joined out of the totals, not the Collection", () => {
    const session = open("PL0200", [], { flags: 0 });
    unlockWeapon(session, CHARACTER, "WEP_PL0200_04");
    expect(progress(session)[184]).toBe(0n);
    expect(progress(session)[185]).toBe(0n);
    expect(progress(session)[152]).toBe(1n);
  });

  it("sets the Trove only on a series 0 weapon", () => {
    const session = open("PL0000", [["WEP_PL0000_02", LAST_XP, 6]]);
    unlockWeapon(session, CHARACTER, "WEP_PL0000_04");
    expect(progress(session)[151]).toBe(0n);
    unlockWeapon(session, CHARACTER, "WEP_PL0000_06");
    expect(progress(session)[151]).toBe(2n);
  });

  it("leaves a later character's late weapons out of the Collection", () => {
    const session = open("PL2100", []);
    unlockWeapon(session, CHARACTER, "WEP_PL2100_04");
    expect(progress(session)[490]).toBe(0n);
    unlockWeapon(session, CHARACTER, "WEP_PL2100_07");
    expect(progress(session)[490]).toBe(1n);
  });

  it("refuses a weapon already held or another character's", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 0, 0]]);
    expect(() => unlockWeapon(session, CHARACTER, "WEP_PL0000_02")).toThrow();
    expect(() => unlockWeapon(session, CHARACTER, "WEP_PL0200_02")).toThrow();
  });

  it("fails with no free entry", () => {
    const session = open(
      "PL0000",
      Array.from({ length: ENTRIES }, () => ["WEP_PL0200_02", 0, 0] as const),
    );
    expect(() => unlockWeapon(session, CHARACTER, "WEP_PL0000_04")).toThrow(
      "no free weapon entry",
    );
  });
});

describe("unlockWeaponSeries", () => {
  it("adds every series, earns the Collection and leaves the levels forged", () => {
    const session = open("PL0000", []);
    unlockWeaponSeries(session, CHARACTER);
    expect(keys(session)).toEqual([]);
    expect(readOwnedWeapons(units(session)).get("PL0000")!.size).toBe(6);
    expect(progress(session)[184]).toBe(6n);
    expect(progress(session)[150]).toBe(6n);
    expect(earned(session)[326]).toBe(true);
    expect(added(session, "WEP_PL0000_04").xp).toBe(5340);
  });

  it("gives a hash-keyed weapon its key", () => {
    const session = open("PL2900", []);
    unlockWeaponSeries(session, CHARACTER);
    expect(added(session, "CDB13688").uncap).toBe(6);
    expect(readOwnedWeapons(units(session)).get("PL2900")!.size).toBe(4);
  });
});

describe("maxWeaponSeries with weapons missing", () => {
  it("forges what is missing and raises everything", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 790, 2]]);
    expect(canMaxWeaponSeries(units(session), CHARACTER)).toBe(true);
    maxWeaponSeries(session, CHARACTER);
    const held = [...readOwnedWeapons(units(session)).get("PL0000")!.values()];
    expect(held).toHaveLength(6);
    expect(held.every((w) => w.uncap === 6 && w.xp === LAST_XP)).toBe(true);
    expect(progress(session)[184]).toBe(6n);
    expect(progress(session)[185]).toBe(900n);
    expect(progress(session)[186]).toBe(19n);
    expect(progress(session)[151]).toBe(6n);
    expect(canMaxWeaponSeries(units(session), CHARACTER)).toBe(false);
  });

  it("offers it on a character holding nothing", () => {
    const session = open("PL0200", []);
    expect(canMaxWeaponSeries(units(session), CHARACTER)).toBe(true);
    maxWeaponSeries(session, CHARACTER);
    expect(progress(session)[153]).toBe(6n);
  });

  it("counts a later character's Trove without the late weapons", () => {
    const session = open("PL2100", []);
    maxWeaponSeries(session, CHARACTER);
    expect(progress(session)[491]).toBe(2n);
    expect(earned(session)[679]).toBe(true);
  });
});

describe("all weapon series", () => {
  const owned = (session: SaveSession, character: string) => [
    ...(readOwnedWeapons(units(session)).get(character)?.values() ?? []),
  ];

  it("unlocks every character's series", () => {
    const session = open("PL0000", [], { others: ["PL0200"] });
    expect(canUnlockAllWeaponSeries(session.save)).toBe(true);
    unlockAllWeaponSeries(session);
    expect(owned(session, "PL0000")).toHaveLength(6);
    expect(owned(session, "PL0200")).toHaveLength(6);
    expect(canUnlockAllWeaponSeries(session.save)).toBe(false);
  });

  it("maxes every character's series", () => {
    const session = open("PL0000", [["WEP_PL0000_02", 790, 2]], {
      others: ["PL0200"],
    });
    expect(canMaxAllWeaponSeries(session.save)).toBe(true);
    maxAllWeaponSeries(session);
    for (const character of ["PL0000", "PL0200"]) {
      const held = owned(session, character);
      expect(held).toHaveLength(6);
      expect(held.every((w) => w.uncap === 6 && w.xp === LAST_XP)).toBe(true);
    }
    expect(progress(session)[184]).toBe(12n);
    expect(canMaxAllWeaponSeries(session.save)).toBe(false);
  });
});
