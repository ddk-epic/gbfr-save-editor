import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readInventory, readSave } from "../src/index";

// Local save, gitignored. Counts and names checked in game.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readInventory", () => {
  it("reads items and wrightstones, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const inventory = readInventory(units);
    expect(inventory.rupies).toBe(386332723);
    expect(inventory.masteryPoints).toBe(3792141);
    // Cobblestone, Terra Horn, Fornax Stone, Rafale Coin,
    // Excavallion Omega Anima, Landbeast Claw.
    expect(
      [
        "ITEM_01_0000",
        "ITEM_32_0053",
        "ITEM_01_0032",
        "ITEM_15_0000",
        "ITEM_05_0001",
        "ITEM_31_0040",
      ].map((key) => inventory.items.get(key)),
    ).toEqual([763, 103, 205, 999, 37, 11]);
    // The wish list is full, among them Horn of Bahamut and Fortitude Crystal (L).
    expect(inventory.wishList).toHaveLength(20);
    expect(inventory.wishList).toEqual(
      expect.arrayContaining(["ITEM_32_0070", "ITEM_10_0003"]),
    );
    expect(inventory.wishList).not.toContain("ITEM_01_0000");
    // Evergreen Crystal Fragment shows as new among the key items.
    expect(inventory.unseenItems).toContain("ITEM_70_0011");
    expect(inventory.unseenItems).not.toContain("ITEM_32_0070");
    expect(inventory.unseenItems).toHaveLength(22);
    // Gallanza's and Beatrix's new-marked abilities.
    expect(inventory.unseenAbilities).toEqual(
      expect.arrayContaining([
        "AB_PL2400_02",
        "AB_PL2400_03",
        "AB_PL2400_04",
        "AB_PL2400_05",
        "AB_PL2400_06",
        "AB_PL2400_07",
        "AB_PL2400_08",
        "AB_PL2600_03",
        "AB_PL2600_04",
        "AB_PL2600_07",
        "AB_PL2600_08",
      ]),
    );
    expect(inventory.unseenAbilities).not.toContain("AB_PL2600_01");
    // Tip of the Spear shows no mark.
    expect(inventory.unseenAbilities).not.toContain("AB_PL2400_01");
    expect(inventory.unseenAbilities).not.toContain("AB_PL0000_01");
    expect(inventory.unseenAbilities).toHaveLength(19);
    expect(inventory.wrightstones.size).toBe(183);
    // Critical Hit Rate 20, HP 15, HP 10, locked.
    expect(inventory.wrightstones.get(25075)).toEqual({
      key: "ITEM_26_0131",
      traits: [
        { key: "SKILL_003_00", level: 20 },
        { key: "SKILL_001_00", level: 15 },
        { key: "SKILL_001_00", level: 10 },
      ],
      locked: true,
      seen: true,
    });
    // The 14 newest, slot ids 38696-38709, show as new.
    const unseen = [...inventory.wrightstones]
      .filter(([, stone]) => !stone.seen)
      .map(([slotId]) => slotId);
    expect(unseen).toHaveLength(14);
    expect(Math.min(...unseen)).toBe(38696);
    expect(Math.max(...unseen)).toBe(38709);
    // The two newest: Critical Hit Rate 7, Autorevive 5, Drain 3 and
    // Weak Point DMG 7, Improved Healing 5, DMG Cap 3, both unlocked.
    expect(inventory.wrightstones.get(38708)).toMatchObject({
      key: "ITEM_26_0012",
      locked: false,
    });
    expect(inventory.wrightstones.get(38709)).toEqual({
      key: "ITEM_28_0012",
      traits: [
        { key: "SKILL_014_00", level: 7 },
        { key: "SKILL_065_00", level: 5 },
        { key: "SKILL_020_00", level: 3 },
      ],
      locked: false,
      seen: false,
    });
  });

  it("reads weapon appearance and seen flags, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const weapons = readInventory(units).weapons;
    // Galatine looks like Claíomh Solais, Dark Wedge like Morbus Rose and
    // Apprentice like World Ender.
    expect(weapons.get(81)?.appearance).toBe("WEP_PL1200_01");
    expect(weapons.get(172)?.appearance).toBe("219EE448");
    expect(weapons.get(5)?.appearance).toBe("WEP_PL2100_07_03");
    expect(
      [...weapons.values()].filter((weapon) => weapon.appearance).length,
    ).toBe(3);
    // Charlotta's two awakened weapons show as new, Claíomh Solais does not.
    expect(weapons.get(44)?.seen).toBe(false);
    expect(weapons.get(81)?.seen).toBe(false);
    expect(weapons.get(17)?.seen).toBe(true);
    expect([...weapons.values()].filter((weapon) => !weapon.seen)).toHaveLength(
      78,
    );
    // Beatrix's Gram and Sandalphon's Efes are not seen in the upgrade menu,
    // Djeeta's Sword of Eos is; Altachiara cannot be awakened.
    expect(weapons.get(143)?.awakeningSeen).toBe(false);
    expect(weapons.get(176)?.awakeningSeen).toBe(false);
    expect(weapons.get(29)?.awakeningSeen).toBe(true);
    expect(weapons.get(165)?.awakeningSeen).toBe(false);
  });

  it("reads summon flags, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const summons = [...readInventory(units).summons];
    // The 10 newest, ids 858-867, show as new.
    const unseen = summons.filter(([, s]) => !s.seen).map(([id]) => id);
    expect(unseen).toEqual([858, 859, 860, 861, 862, 863, 864, 865, 866, 867]);
    // 36 have been equipped, the four equipped now among them.
    const equipped = summons
      .filter(([, s]) => s.everEquipped)
      .map(([id]) => id);
    expect(equipped).toHaveLength(36);
    expect(equipped).toEqual(expect.arrayContaining([50, 629, 612, 427]));
  });

  it("reads sigil locks and seen flags, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const sigils = [...readInventory(units).sigils.values()];
    const count = (key: string, second: string, locked: boolean) =>
      sigils.filter(
        (s) =>
          s.key === key &&
          s.secondaryTrait?.key === second &&
          s.locked === locked,
      ).length;
    // Berserker Echo / Quick Cooldown: 7 locked, 4 not.
    expect(count("GEEN_233_24", "SKILL_069_00", true)).toBe(7);
    expect(count("GEEN_233_24", "SKILL_069_00", false)).toBe(4);
    // Quick Charge / Quick Cooldown: both locked, in Tweyen's loadouts.
    expect(count("GEEN_111_24", "SKILL_069_00", true)).toBe(2);
    expect(count("GEEN_111_24", "SKILL_069_00", false)).toBe(0);
    // No sigil shows as new.
    expect(sigils.filter((s) => !s.seen)).toHaveLength(0);
  });

  it("reads curio rewards in appraisal order, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const { curios } = readInventory(units);
    expect(curios).toHaveLength(308);
    // Berserker V+, Glass Cannon V+, Berserker Echo+ Lv15, Grand Refinium I,
    // Stamina V+ ... Stronghold V+, Celestial Ventus V+, Stun Power V+.
    const sigil = (
      key: string,
      level: number,
      trait: string,
      seed: number,
    ) => ({
      type: "sigil",
      key,
      level,
      traits: [trait],
      seed,
    });
    expect(curios.slice(0, 5).map((c) => c.reward)).toEqual([
      sigil("GEEN_154_24", 0, "SKILL_154_00", 1828417378),
      sigil("GEEN_158_24", 0, "SKILL_158_00", 3022663574),
      sigil("GEEN_233_24", 15, "SKILL_233_00", 1628797413),
      { type: "material", key: "0EB683CD" },
      sigil("GEEN_006_24", 0, "SKILL_006_00", 4169356646),
    ]);
    // Tier 1-4 and the number the curio was found at; 2001 holds the newest.
    expect(curios.slice(0, 4).map((c) => [c.tier, c.serial])).toEqual([
      [4, 16376],
      [3, 16377],
      [1, 16378],
      [3, 16379],
    ]);
    expect(curios.at(-1)?.serial).toBe(16683);
    expect(curios.slice(-3).map((c) => c.reward?.key)).toEqual([
      "GEEN_144_24",
      "9300FADB",
      "GEEN_004_24",
    ]);
    // Silver Wolf Trefoil first appears at curio 67, shown at 64 once the
    // repeated materials before it stack.
    expect(curios[67]?.reward).toEqual({ type: "material", key: "6E13E372" });
    expect(curios[286]?.reward).toEqual({
      type: "wrightstone",
      key: "ITEM_25_0020",
      seed: expect.any(Number),
    });
  });
});
