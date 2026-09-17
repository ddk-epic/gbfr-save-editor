import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readInventory, readSave } from "../src/index";

// Local save, gitignored. Any save works: these hold at every point of progress.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readInventory", () => {
  const inventory = hasSave
    ? readInventory(readSave(readFileSync(SAVE_PATH)).slotData.units)
    : (undefined as never);

  it("reads items, the wish list and the new marks against one key set", () => {
    const { items, wishList, unseenItems } = inventory;
    expect(items.size).toBeGreaterThan(0);
    expect([...items.keys()].filter((key) => key.startsWith("#"))).toEqual([]);
    expect([...items.values()].filter((count) => count < 0)).toEqual([]);
    // Both lists name items the inventory holds; the wish list caps at 20.
    expect(wishList.filter((key) => !items.has(key))).toEqual([]);
    expect(unseenItems.filter((key) => !items.has(key))).toEqual([]);
    expect(wishList.length).toBeLessThanOrEqual(20);
    expect(new Set(wishList).size).toBe(wishList.length);
  });

  it("reads wrightstones with up to three traits, strongest first", () => {
    for (const [slotId, stone] of inventory.wrightstones) {
      expect(stone.key, `${slotId}`).not.toMatch(/^#/);
      expect(stone.traits.length, `${slotId}`).toBeLessThanOrEqual(3);
      // The game rolls them in descending level and shows them that way.
      for (const [i, trait] of stone.traits.entries()) {
        expect(trait.key, `${slotId}`).not.toMatch(/^#/);
        if (i > 0)
          expect(trait.level, `${slotId}`).toBeLessThanOrEqual(
            stone.traits[i - 1]!.level,
          );
      }
    }
  });

  it("reads weapons with five trait slots and a resolved appearance", () => {
    for (const [slotId, weapon] of inventory.weapons) {
      expect(weapon.key, `${slotId}`).not.toMatch(/^#/);
      // Terminus aside, the slots are there whether or not they hold a trait.
      expect(weapon.traits, `${slotId}`).toHaveLength(5);
      if (weapon.appearance)
        expect(weapon.appearance, `${slotId}`).not.toMatch(/^#/);
      expect(weapon.wrightstone?.traits.length ?? 0).toBeLessThanOrEqual(3);
    }
  });

  it("reads sigils and summons against their key tables", () => {
    for (const sigil of inventory.sigils.values()) {
      expect(sigil.key).not.toMatch(/^#/);
      expect(sigil.secondaryTrait?.key ?? "").not.toMatch(/^#/);
    }
    for (const summon of inventory.summons.values()) {
      expect(summon.key).not.toMatch(/^#/);
      expect(summon.trait?.key ?? "").not.toMatch(/^#/);
      expect(summon.equipBonus?.key ?? "").not.toMatch(/^#/);
    }
  });

  it("reads curios in appraisal order", () => {
    const { curios } = inventory;
    for (const [i, curio] of curios.entries()) {
      // serial is the number the curio was found at, so it only climbs.
      if (i > 0) expect(curio.serial).toBeGreaterThan(curios[i - 1]!.serial);
      expect([1, 2, 3, 4]).toContain(curio.tier);
      if (curio.reward) {
        expect(["sigil", "material", "wrightstone"]).toContain(
          curio.reward.type,
        );
        expect(curio.reward.key).not.toMatch(/^#/);
      }
    }
  });
});
