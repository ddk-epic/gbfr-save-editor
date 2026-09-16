import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  readCharacterData,
  readInventory,
  readProfile,
  readSave,
  type CharacterData,
} from "../src/index";

// Local save, gitignored. Party, equipment and progression checked in game.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readCharacterData", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const data: CharacterData = hasSave
    ? readCharacterData(readSave(readFileSync(SAVE_PATH)).slotData.units)
    : (undefined as never);
  const warnings = warn.mock.calls.map((args) => String(args[0]));
  warn.mockRestore();
  const character = (key: string) =>
    data.characters.find((c) => c.character === key);

  it("resolves every hash in the save", () => {
    expect(warnings).toEqual([]);
  });

  it("reads level and base stats", () => {
    expect(character("PL2500")).toMatchObject({
      level: 100,
      xp: 8400000,
      baseHp: 3154,
      baseAttack: 636,
    });
  });

  it("reads loadouts", () => {
    const [first] = data.loadouts;
    expect(first).toMatchObject({ character: "PL0100", name: "Loadout 01" });
    expect(first?.weapon?.key).toBe("WEP_PL0100_01_01");
    expect(
      data.loadouts.filter((l) => l.character === "PL1800").map((l) => l.name),
    ).toEqual(["Fatebreaker"]);
  });

  it("reads Cagliostro's gear apart from her loadout, as in game", () => {
    // Slot 3 is empty on her, Fatebreaker/Quick Cooldown in the loadout.
    const sigils = (
      list: (typeof data.loadouts)[number]["sigils"] | undefined,
    ) => list?.map((sigil) => sigil?.key);
    const loadout = data.loadouts.find(
      (l) => l.character === "PL1800" && l.name === "Fatebreaker",
    );
    const worn = sigils(character("PL1800")?.sigils);
    expect(worn?.[2]).toBeUndefined();
    expect(worn?.filter(Boolean)).toHaveLength(11);
    expect(sigils(loadout?.sigils)?.filter((_, i) => i !== 2)).toEqual(
      worn?.filter((_, i) => i !== 2),
    );
  });

  it("reads the party", () => {
    expect(data.party).toEqual(["PL0400", "PL2800", "PL2700", "PL1000"]);
  });

  it("reads the equipped summons, as in game", () => {
    // Vrazarek, Lucilius, Evyl, Rolan, every bonus Normal Attack DMG Cap Up.
    // Lucilius and Rolan draw the group B ladder, a separate key.
    expect(
      data.summons.map(
        (s) =>
          s &&
          `${s.trait?.key}@${s.trait?.level} ${s.equipBonus?.key}@${s.equipBonus?.level}`,
      ),
    ).toEqual([
      "SKILL_044_00@15 A66241C9@9",
      "SKILL_233_00@15 9245DFA4@6",
      "SKILL_234_00@15 A66241C9@9",
      "SKILL_146_00@15 9245DFA4@5",
    ]);
  });

  it("reads quest records, as in game", () => {
    // Most used characters 1-3, most used weapon and quests cleared.
    expect(character("PL0100")?.questsUsed).toBe(3498);
    expect(character("PL0400")?.questsUsed).toBe(1385);
    expect(character("PL2300")?.questsUsed).toBe(1338);
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const mostUsed = [...readInventory(units).weapons.values()].reduce(
      (a, b) => (b.questsUsed > a.questsUsed ? b : a),
    );
    // Partenza +99, level 150.
    expect(mostUsed).toMatchObject({
      key: "WEP_PL0100_01_01",
      xp: 162540,
      plus: 99,
      questsUsed: 3494,
    });
    expect(readProfile(units)).toEqual({ questsCleared: 10484 });
    expect(character("PL1000")?.questsUsed).toBe(5);
    expect(character("SLOT01")?.questsUsed).toBe(0);
  });

  it("reads master levels, as in game", () => {
    // Beatrix has no master trait points spent.
    expect(character("PL2600")).toMatchObject({
      masterXp: 3309499,
      masterLevel: 55,
    });
    expect(character("PL2500")?.masterLevel).toBe(55);
    expect(character("PL1400")).toMatchObject({
      masterXp: 1639499,
      masterLevel: 50,
    });
  });

  it("reads master traits", () => {
    const count = (key: string, chosen?: boolean) => {
      const counts: Record<string, number> = {};
      for (const cell of character(key)?.masterTraits ?? []) {
        if (chosen !== undefined && cell.chosen !== chosen) continue;
        const group = cell.perk ? "perk" : cell.rank;
        counts[group] = (counts[group] ?? 0) + 1;
      }
      return counts;
    };
    // Every point spent: the 10/10/10/20 pools, plus the perks they light.
    expect(count("PL2500", true)).toEqual({
      perk: 5,
      r1: 10,
      r2: 10,
      r3: 10,
      ex: 20,
    });
    expect(count("PL2600", true)).toEqual({});
  });

  it("reads masteries, as in game", () => {
    const msp = (key: string) =>
      Object.values(character(key)?.masteries ?? {}).reduce(
        (sum, section) => sum + section.msp,
        0,
      );
    // Every node taken: the per-character MSP totals, as in game.
    expect(msp("PL0400")).toBe(966702);
    expect(msp("PL2500")).toBe(967030);
    expect(character("PL2500")?.masteries).toMatchObject({
      offense: { taken: 188 },
      offenseExtension: { taken: 25 },
      defense: { taken: 142 },
      defenseExtension: { taken: 25 },
      collection: { taken: 24 },
      transcendence: { taken: 24 },
    });
    // Offense and Defense to 100%, Collection complete, no transcendence.
    expect(character("PL1200")?.masteries).toMatchObject({
      offense: { taken: 185, msp: 19035 },
      offenseExtension: { taken: 0, msp: 0 },
      defense: { taken: 133, msp: 15636 },
      defenseExtension: { taken: 0, msp: 0 },
      collection: { taken: 36, msp: 1104 },
      transcendence: { taken: 0, msp: 0 },
    });
    expect(character("PL1800")?.masteries.transcendence).toMatchObject({
      taken: 36,
      msp: 12720,
    });
  });

  it("reads fate episodes", () => {
    const completed = (key: string) =>
      character(key)?.fateEpisodes.filter((episode) => episode.completed)
        .length;
    // State 14 on the first three and 30 on the rest, all completed.
    expect(completed("PL2500")).toBe(11);
    expect(completed("PL2900")).toBe(11);
    expect(completed("PL2400")).toBe(0);
    expect(
      character("PL0800")?.fateEpisodes.map((episode) => episode.completed),
    ).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    // REMI_PL0200_00 is stored but the menu does not list it.
    expect(
      character("PL0200")?.fateEpisodes.map((episode) => episode.key),
    ).not.toContain("REMI_PL0200_00");
  });

  it("reads Maglielle's over-masteries, as in game", () => {
    expect(character("PL2500")?.overMasteries).toEqual([
      { key: "MED_EFF_ABILITY_LIMIT01", level: 4 },
      { key: "MED_EFF_HP01", level: 7 },
      { key: "MED_EFF_BREAK01", level: 8 },
      { key: "MED_EFF_ATTACK_LIMIT01", level: 10 },
    ]);
  });

  it("reads Maglielle's Terminus, as in game", () => {
    expect(character("PL2500")?.weapon).toEqual({
      key: "860AC3BF",
      xp: 162540,
      uncap: 6,
      plus: 99,
      awakening: 10,
      transcendence: 7,
      questsUsed: 28,
      // Catastrophe Nova, Drain, DMG Cap, Sigil Booster, Unbound Master
      traits: [
        "1E1CECCE",
        "SKILL_067_00",
        "SKILL_020_00",
        "SKILL_113_00",
        "79027FC8",
      ],
      wrightstone: {
        key: "ITEM_25_0131",
        traits: [
          { key: "SKILL_004_00", level: 20 },
          { key: "SKILL_068_00", level: 15 },
          { key: "SKILL_106_00", level: 10 },
        ],
      },
      appearance: undefined,
      seen: true,
      awakeningSeen: true,
    });
  });

  it("reads Io with no sigils", () => {
    expect(character("PL0400")?.sigils.every((s) => s === undefined)).toBe(
      true,
    );
  });

  it("reads Eustace with one skill slot empty", () => {
    expect(character("PL2700")?.skills).toEqual([
      "AB_PL2700_04",
      undefined,
      "AB_PL2700_06",
      "AB_PL2700_03",
    ]);
  });

  it("reads Percival's weapon and full sigil slots", () => {
    const percival = character("PL1000");
    expect(percival?.weapon?.key).toBe("WEP_PL1000_06_03");
    expect(percival?.sigils.filter(Boolean)).toHaveLength(12);
  });
});
