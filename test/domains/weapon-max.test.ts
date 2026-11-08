import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import { WEAPON_TROVES } from "../../src/domains/trophy/data.gen";
import {
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CAPTAIN,
} from "../../src/domains/character/attributes";
import {
  canMaxWeaponSeries,
  maxWeaponSeries,
} from "../../src/workflows/weapon";
import { readWeapon, weaponLevelOf } from "../../src/domains/weapon/read";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "../../src/domains/weapon/attributes";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
import { SAVE_ENTITY } from "../../src/core/save-entity";
import { SaveSession } from "../../src/core/session";
import { fixtureFile } from "../../src/testing";

const CHARACTER = 10000;
const LAST_XP = 162540;
const ENTRIES = 12;
const SERIES = [
  "WEP_PL0000_02",
  "WEP_PL0000_03",
  "WEP_PL0000_04",
  "WEP_PL0000_05",
  "WEP_PL0000_06",
  "WEP_PL0000_01_01",
];
type Row = readonly [key: string, xp: number, uncap: number, flags?: number];

const open = (
  rows: readonly Row[],
  progress: Record<number, bigint> = {},
  character = "PL0000",
) => {
  const counts = Array<bigint>(1200).fill(0n);
  for (const [index, value] of Object.entries(progress))
    counts[Number(index)] = value;
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
        [CHARACTER_FLAGS, 1],
      ],
      ...Object.fromEntries(
        Array.from({ length: ENTRIES }, (_, index) => {
          const [key, xp, uncap, flags = 129] = rows[index] ?? ["", 0, 0, 0];
          return [
            WEAPON_FIRST + index,
            [
              [WEAPON_ID, key ? index + 1 : 0],
              [WEAPON_KEY, hashId(key)],
              [WEAPON_XP, xp],
              [WEAPON_UNCAP, uncap],
              [WEAPON_FLAGS, flags],
            ],
          ];
        }),
      ),
    }),
  );
};
const held = (session: SaveSession, index = 0) =>
  readWeapon(session.save.slotData.units, WEAPON_FIRST + index)!;
const save = (session: SaveSession) =>
  session.save.slotData.units.of(SAVE_ENTITY);
const progress = (session: SaveSession) => save(session).get(TROPHY_PROGRESS);
const earned = (session: SaveSession) => save(session).get(TROPHY_EARNED);

describe("weaponLevelOf", () => {
  it("reads the traced levels", () => {
    expect(weaponLevelOf(0)).toBe(1);
    expect(weaponLevelOf(790)).toBe(40);
    expect(weaponLevelOf(5340)).toBe(65);
    expect(weaponLevelOf(LAST_XP)).toBe(150);
  });
});

describe("maxWeaponSeries", () => {
  it("raises every held series, adds the uncaps and sets the recounts", () => {
    const session = open(
      [
        ["WEP_PL0000_02", 790, 2],
        ["WEP_PL0000_06", 0, 6],
        ["WEP_PL0000_03", 0, 0],
        ["WEP_PL0000_04", 0, 0],
        ["WEP_PL0000_05", 0, 0],
        ["WEP_PL0000_01_01", 0, 0],
      ],
      { 186: 3n, 185: 6n, 151: 1n },
    );
    maxWeaponSeries(session, CHARACTER);
    expect(held(session).uncap).toBe(6);
    expect(held(session).xp).toBe(LAST_XP);
    expect(held(session, 1).xp).toBe(LAST_XP);
    expect(progress(session)[186]).toBe(31n);
    expect(progress(session)[185]).toBe(900n);
    expect(progress(session)[151]).toBe(6n);
    expect(progress(session)[225]).toBe(0n);
  });

  it("earns the tiers the counts meet and leaves 501 to the game", () => {
    const session = open(SERIES.map((key) => [key, 0, 0] as const));
    maxWeaponSeries(session, CHARACTER);
    expect(progress(session)[185]).toBe(900n);
    expect(progress(session)[186]).toBe(36n);
    expect(progress(session)[151]).toBe(6n);
    for (const badge of [364, 365, 369, 370, 327])
      expect(earned(session)[badge]).toBe(true);
    for (const badge of [366, 371]) expect(earned(session)[badge]).toBe(false);
    expect(progress(session)[501]).toBe(0n);
  });

  it("earns the Trove at the character's own quantity", () => {
    const [index, badge, quantity] = WEAPON_TROVES.PL2200!;
    expect(quantity).toBe(2);
    const session = open(
      [
        ["WEP_PL2200_01", 0, 0],
        ["WEP_PL2200_07", 0, 0],
      ],
      {},
      "PL2200",
    );
    maxWeaponSeries(session, CHARACTER);
    expect(progress(session)[index]).toBe(2n);
    expect(earned(session)[badge]).toBe(true);
  });

  it("has a Trove for every character, Sandalphon's named differently", () => {
    expect(Object.keys(WEAPON_TROVES)).toHaveLength(28);
    expect(WEAPON_TROVES.PL2100).toEqual([491, 679, 2]);
  });

  it("raises a fresh forge and leaves weapons outside the series and stand-ins", () => {
    const session = open([
      ["WEP_PL0000_02", 0, 0],
      ["WEP_PL0000_10", 1740, 2],
      ["WEP_PL0000_05", 0, 0, 128],
      ["WEP_PL0000_A0", 0, 0],
    ]);
    maxWeaponSeries(session, CHARACTER);
    expect(held(session, 1).uncap).toBe(2);
    expect(held(session, 2).xp).toBe(LAST_XP);
    expect(held(session, 3).xp).toBe(0);
    expect(progress(session)[185]).toBe(900n);
  });

  it("is not offered on the captain not in play, whose Trove the captain in play shares", () => {
    const session = open(
      [
        ["WEP_PL0000_02", LAST_XP, 6],
        ["WEP_PL0100_03", 90, 0],
      ],
      { 151: 1n },
      "PL0100",
    );
    expect(canMaxWeaponSeries(session.save.slotData.units, CHARACTER)).toBe(
      false,
    );
    expect(progress(session)[151]).toBe(1n);
  });

  it("leaves the captain not in play out of the level sum", () => {
    const session = open([
      ["WEP_PL0000_02", 0, 0],
      ["WEP_PL0100_02", LAST_XP, 6],
    ]);
    maxWeaponSeries(session, CHARACTER);
    expect(progress(session)[185]).toBe(900n);
  });

  it("repairs a save with the weapons maxed and the trophies unearned", () => {
    const session = open(
      SERIES.map((key) => [key, LAST_XP, 6] as const),
      { 186: 36n, 185: 900n, 151: 6n },
    );
    const units = session.save.slotData.units;
    expect(canMaxWeaponSeries(units, CHARACTER)).toBe(true);
    maxWeaponSeries(session, CHARACTER);
    expect(earned(session)[327]).toBe(true);
    expect(progress(session)[186]).toBe(36n);
    expect(canMaxWeaponSeries(units, CHARACTER)).toBe(false);
  });

  it("is offered until nothing is left to change", () => {
    const session = open([["WEP_PL0000_02", 0, 0]]);
    const units = session.save.slotData.units;
    expect(canMaxWeaponSeries(units, CHARACTER)).toBe(true);
    maxWeaponSeries(session, CHARACTER);
    expect(canMaxWeaponSeries(units, CHARACTER)).toBe(false);
    expect(() => maxWeaponSeries(session, CHARACTER)).toThrow(
      "no weapon series",
    );
  });
});
