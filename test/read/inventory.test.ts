import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  ABILITY_ACQUIRED,
  ABILITY_FLAGS,
  ABILITY_KEY,
  ABILITY_SEEN,
} from "../../src/domains/ability/attributes";
import { CURIO_KEY, CURIO_SERIAL } from "../../src/domains/curio/attributes";
import {
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../../src/domains/item/attributes";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
} from "../../src/domains/sigil/attributes";
import {
  SUMMON_FLAGS,
  SUMMON_ID,
  SUMMON_KEY,
} from "../../src/domains/summon/attributes";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_STRIDE,
  TRAIT_WRIGHTSTONE,
} from "../../src/domains/trait/attributes";
import {
  SAVE_ENTITY,
  USER_MASTERY_POINTS,
  USER_RUPIES,
} from "../../src/domains/user/attributes";
import {
  WEAPON_FIRST,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_UNCAP,
} from "../../src/domains/weapon/attributes";
import {
  WRIGHTSTONE_FIRST,
  WRIGHTSTONE_ID,
  WRIGHTSTONE_KEY,
} from "../../src/domains/wrightstone/attributes";
import { readInventory } from "../../src/read/inventory";
import { unitStore, type EntityUnits } from "../../src/testing";

const POTION = "ITEM_10_0000";
const MATERIAL = "ITEM_11_0000";
const STONE = "ITEM_28_0000";
const WEAPON = "WEP_PL1600_03";
// The summon table names unresolved keys in hex; the save stores the hash.
const SUMMON_HASH = 0x0033943a;
const SUMMON = "0033943A";
const TRAITS = ["SKILL_094_00", "SKILL_070_00", "SKILL_124_01"] as const;
const ABILITY_UNSEEN = "AB_PL2700_06";
const ABILITY_SEEN_KEY = "AB_PL2000_05";

/** A wrightstone's traits live in their own entity range, one entity each. */
const traitList = (
  holder: number,
  traits: readonly (readonly [string, number])[],
): Record<number, EntityUnits> =>
  Object.fromEntries(
    traits.map(([key, level], i) => [
      TRAIT_FIRST + holder * TRAIT_STRIDE + i,
      [
        [TRAIT_KEY, hashId(key)],
        [TRAIT_LEVEL, level],
      ],
    ]),
  );

const units = unitStore({
  [SAVE_ENTITY]: [
    [USER_RUPIES, 5000],
    [USER_MASTERY_POINTS, 12],
  ],
  1: [
    [ITEM_KEY, hashId(POTION)],
    [ITEM_COUNT, 3],
    // Held but not seen, and not wished for.
    [ITEM_FLAGS, 0],
  ],
  2: [
    [ITEM_KEY, hashId(MATERIAL)],
    [ITEM_COUNT, 0],
    [ITEM_FLAGS, 1 | 8],
  ],
  // Two curios, serials against entity order, so a sort by serial shows.
  3: [
    [CURIO_KEY, hashId("ITEM_19_0001")],
    [CURIO_SERIAL, 9],
  ],
  4: [
    [CURIO_KEY, hashId("ITEM_19_0002")],
    [CURIO_SERIAL, 4],
  ],
  // Two acquired abilities, one of them seen.
  5: [
    [ABILITY_KEY, hashId(ABILITY_UNSEEN)],
    [ABILITY_FLAGS, ABILITY_ACQUIRED],
  ],
  6: [
    [ABILITY_KEY, hashId(ABILITY_SEEN_KEY)],
    [ABILITY_FLAGS, ABILITY_ACQUIRED | ABILITY_SEEN],
  ],
  [SIGIL_FIRST]: [
    [SIGIL_ID, 71],
    [SIGIL_KEY, hashId("GEEN_158_13")],
  ],
  [WEAPON_FIRST]: [
    [WEAPON_ID, 12],
    [WEAPON_KEY, hashId(WEAPON)],
    [WEAPON_UNCAP, 5],
  ],
  [WRIGHTSTONE_FIRST]: [
    [WRIGHTSTONE_ID, 33],
    [WRIGHTSTONE_KEY, hashId(STONE)],
  ],
  // Summons sit at their own entities, keyed by the id 1451 references.
  9: [
    [SUMMON_ID, 9],
    [SUMMON_KEY, SUMMON_HASH],
    [SUMMON_FLAGS, 2],
  ],
  // The stone's three traits under holder TRAIT_WRIGHTSTONE, the main one
  // weakest, so a sort by level shows.
  ...traitList(TRAIT_WRIGHTSTONE, [
    [TRAITS[0], 3],
    [TRAITS[1], 15],
    [TRAITS[2], 8],
  ]),
});

describe("readInventory", () => {
  const inventory = readInventory(units);

  it("reads counts by item key, and the wallet", () => {
    expect(inventory.rupies).toBe(5000);
    expect(inventory.masteryPoints).toBe(12);
    expect([...inventory.items]).toEqual([
      [POTION, 3],
      [MATERIAL, 0],
    ]);
  });

  it("lists wished-for items, and held items not yet seen", () => {
    expect(inventory.wishList).toEqual([MATERIAL]);
    // The material is seen but not held; the potion is held but not seen.
    expect(inventory.unseenItems).toEqual([POTION]);
  });

  it("lists acquired abilities not yet seen", () => {
    expect(inventory.unseenAbilities).toEqual([ABILITY_UNSEEN]);
  });

  it("collects the other inventories by id", () => {
    expect([...inventory.sigils.keys()]).toEqual([71]);
    expect([...inventory.weapons.keys()]).toEqual([12]);
    expect([...inventory.wrightstones.keys()]).toEqual([33]);
    expect([...inventory.summons.keys()]).toEqual([9]);
  });

  it("reads a weapon's own fields", () => {
    const weapon = inventory.weapons.get(12)!;
    expect(weapon.key).toBe(WEAPON);
    expect(weapon.uncap).toBe(5);
    // No stone welded on, five empty trait positions.
    expect(weapon.wrightstone).toBeUndefined();
    expect(weapon.traits).toEqual([...Array(5)].map(() => undefined));
  });

  it("reads a wrightstone's traits in save order, main first", () => {
    const stone = inventory.wrightstones.get(33)!;
    expect(stone.key).toBe(STONE);
    expect(stone.traits.map(({ key, level }) => [key, level])).toEqual([
      [TRAITS[0], 3],
      [TRAITS[1], 15],
      [TRAITS[2], 8],
    ]);
  });

  it("reads a summon, flags and all", () => {
    const summon = inventory.summons.get(9)!;
    expect(summon.key).toBe(SUMMON);
    expect(summon.seen).toBe(true);
    expect(summon.everEquipped).toBe(false);
  });

  it("lists curios in save order, the order the game appraises them", () => {
    expect(
      inventory.curios.map(({ key, tier, serial }) => ({ key, tier, serial })),
    ).toEqual([
      { key: "ITEM_19_0001", tier: 1, serial: 9 },
      { key: "ITEM_19_0002", tier: 2, serial: 4 },
    ]);
  });
});
