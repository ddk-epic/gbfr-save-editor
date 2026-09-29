import { describe, expect, it } from "vitest";
import { EMPTY_HASH } from "../../src/core/keys";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_STRIDE,
  TRAIT_WEAPON,
} from "../../src/domains/trait/attributes";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import {
  WEAPON_APPEARANCE,
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_TRAITS,
  WEAPON_TRAIT_POSITIONS,
  WEAPON_WRIGHTSTONE,
} from "../../src/domains/weapon/attributes";
import { removeWrightstone } from "../../src/domains/weapon/edit";
import {
  findWeaponById,
  readOwnedWeapons,
  readWeapon,
} from "../../src/domains/weapon/read";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile, unitStore, type EntityUnits } from "../../src/testing";

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

  it("reads the owner of a hash-keyed weapon from the table", () => {
    const units = unitStore({
      [WEAPON]: [
        [WEAPON_ID, 9],
        [WEAPON_KEY, 0x219ee448],
      ],
    });
    expect(readWeapon(units, WEAPON)).toEqual(
      expect.objectContaining({ key: "219EE448", character: "PL2900" }),
    );
  });
});

describe("readOwnedWeapons", () => {
  /** WEAPON_FLAGS bit marking a weapon the player holds. */
  const WEAPON_OWNED = 1;
  const weapon = (
    id: number,
    key: number,
    flags = WEAPON_OWNED,
  ): EntityUnits => [
    [WEAPON_ID, id],
    [WEAPON_KEY, key],
    [WEAPON_FLAGS, flags],
  ];
  const units = unitStore({
    [WEAPON_FIRST]: weapon(1, hashId("WEP_PL2900_01")),
    [WEAPON_FIRST + 1]: weapon(2, 0x219ee448),
    // Not held, a bonus series, and an NPC's.
    [WEAPON_FIRST + 2]: weapon(3, hashId("WEP_PL2900_04"), 0),
    [WEAPON_FIRST + 3]: weapon(4, hashId("WEP_PL0100_10")),
    [WEAPON_FIRST + 4]: weapon(5, hashId("WEP_NP0300_01")),
  });
  const owned = readOwnedWeapons(units);

  it("groups held Collection weapons by owner and series", () => {
    const ids = (character: string) =>
      [...(owned.get(character) ?? [])].map(([series, w]) => [series, w.id]);
    expect(ids("PL2900")).toEqual([
      [4, 1],
      [2, 2],
    ]);
    expect(owned.has("PL0100")).toBe(false);
  });

  it("keeps an NPC's weapon under its own CharaId", () => {
    expect(owned.get("NP0300")?.get(4)?.id).toBe(5);
  });
});

describe("removeWrightstone", () => {
  const traitsOf = (weapon: number) =>
    TRAIT_FIRST + (TRAIT_WEAPON + weapon - WEAPON_FIRST) * TRAIT_STRIDE;
  const trait = (key: number, level: number): EntityUnits => [
    [TRAIT_KEY, key],
    [TRAIT_LEVEL, level],
  ];
  const stoned = (entity: number, id: number): Record<number, EntityUnits> => ({
    [entity]: [
      [WEAPON_ID, id],
      [WEAPON_KEY, hashId("WEP_PL0000_01")],
      [WEAPON_WRIGHTSTONE, hashId("ITEM_25_0131")],
    ],
    [traitsOf(entity)]: trait(hashId("SKILL_000_00"), 20),
    [traitsOf(entity) + 1]: trait(hashId("SKILL_001_00"), 15),
    [traitsOf(entity) + 2]: trait(hashId("SKILL_002_00"), 10),
  });

  it("empties the stone and its traits on that weapon only", () => {
    const session = SaveSession.open(
      fixtureFile({
        0: [[SAVE_HASHSEED, 7]],
        ...stoned(WEAPON, 9),
        ...stoned(WEAPON + 1, 10),
      }),
    );
    removeWrightstone(session, 9);
    const units = session.save.slotData.units;
    expect(readWeapon(units, WEAPON)!.wrightstone).toBeUndefined();
    for (let i = 0; i < 3; i++) {
      expect(units.values(TRAIT_KEY, traitsOf(WEAPON) + i)).toEqual([
        EMPTY_HASH,
      ]);
      expect(units.values(TRAIT_LEVEL, traitsOf(WEAPON) + i)).toEqual([0]);
    }
    expect(readWeapon(units, WEAPON + 1)!.wrightstone).toEqual(
      expect.objectContaining({ key: "ITEM_25_0131" }),
    );
  });

  it("refuses a weapon without a stone", () => {
    const session = SaveSession.open(
      fixtureFile({
        [WEAPON]: [
          [WEAPON_ID, 9],
          [WEAPON_WRIGHTSTONE, EMPTY_HASH],
        ],
      }),
    );
    expect(() => removeWrightstone(session, 9)).toThrow("has no wrightstone");
    expect(() => removeWrightstone(session, 10)).toThrow("no weapon with id");
  });
});
