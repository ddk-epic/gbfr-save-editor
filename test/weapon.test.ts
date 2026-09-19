import { describe, expect, it } from "vitest";
import { EMPTY_HASH } from "../src/core/keys";
import { hashId } from "../src/core/xxhash32-custom";
import {
  WEAPON_APPEARANCE,
  WEAPON_FIRST,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_TRAITS,
  WEAPON_TRAIT_POSITIONS,
} from "../src/domains/weapon/attributes";
import { findWeaponById, readWeapon } from "../src/domains/weapon/read";
import { unitStore } from "./fixture";

const WEAPON = WEAPON_FIRST + 3;

describe("readWeapon", () => {
  it("gives one trait per position, empty or not", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_TRAITS, [hashId("SKILL_000_00"), EMPTY_HASH]],
      ],
    });
    const weapon = readWeapon(units, WEAPON)!;
    expect(weapon.key).toBe("WEP_PL0000_01");
    expect(weapon.traits).toEqual([
      "SKILL_000_00",
      ...Array(WEAPON_TRAIT_POSITIONS - 1).fill(undefined),
    ]);
  });

  it("reads no appearance for a weapon keeping its own look", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_APPEARANCE, EMPTY_HASH],
      ],
      [WEAPON + 1]: [
        [WEAPON_ID, 10],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
        [WEAPON_APPEARANCE, hashId("WEP_PL0000_02")],
      ],
    });
    expect(readWeapon(units, WEAPON)!.appearance).toBeUndefined();
    expect(readWeapon(units, WEAPON + 1)!.appearance).toBe("WEP_PL0000_02");
  });

  it("skips an entity whose id is 0 or whose key is empty", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 0],
        [WEAPON_KEY, hashId("WEP_PL0000_01")],
      ],
      [WEAPON + 1]: [
        [WEAPON_ID, 10],
        [WEAPON_KEY, EMPTY_HASH],
      ],
    });
    expect(readWeapon(units, WEAPON)).toBeUndefined();
    expect(readWeapon(units, WEAPON + 1)).toBeUndefined();
  });

  it("finds a weapon's entity by id", () => {
    const units = unitStore({ [WEAPON]: [[WEAPON_ID, 9]] });
    expect(findWeaponById(units, 9)).toBe(WEAPON);
    expect(findWeaponById(units, 10)).toBeUndefined();
  });
});
