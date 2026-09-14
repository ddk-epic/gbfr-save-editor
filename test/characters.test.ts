import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  readCharacterData,
  readInventory,
  readCounterQuests,
  readArchives,
  readGlossary,
  readMusic,
  readTips,
  readEarnedTrophies,
  readProfile,
  readSave,
  readSideQuests,
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

  it("reads every character", () => {
    const keys = data.characters.map((c) => c.character);
    expect(keys).toHaveLength(41);
    expect(keys.slice(0, 3)).toEqual(["PL0000", "PL0100", "PL0200"]);
  });

  it("reads level and base stats", () => {
    expect(character("PL2500")).toMatchObject({
      level: 100,
      xp: 8400000,
      baseHp: 3154,
      baseAttack: 636,
    });
  });

  it("reads sigil traits at the sigil level", () => {
    for (const equipment of [...data.characters, ...data.loadouts]) {
      for (const sigil of equipment.sigils) {
        if (!sigil) continue;
        expect(sigil.primaryTrait?.level).toBe(sigil.level);
        if (sigil.secondaryTrait)
          expect(sigil.secondaryTrait.level).toBe(sigil.level);
      }
    }
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
    expect(curios.slice(0, 5).map((c) => c.reward)).toEqual([
      { kind: "sigil", key: "GEEN_154_24", level: 0 },
      { kind: "sigil", key: "GEEN_158_24", level: 0 },
      { kind: "sigil", key: "GEEN_233_24", level: 15 },
      { kind: "material", key: "0EB683CD" },
      { kind: "sigil", key: "GEEN_006_24", level: 0 },
    ]);
    expect(curios.slice(-3).map((c) => c.reward?.key)).toEqual([
      "GEEN_144_24",
      "9300FADB",
      "GEEN_004_24",
    ]);
    // Silver Wolf Trefoil first appears at curio 67, shown at 64 once the
    // repeated materials before it stack.
    expect(curios[67]?.reward).toEqual({ kind: "material", key: "6E13E372" });
    expect(curios[286]?.reward).toEqual({
      kind: "wrightstone",
      key: "ITEM_25_0020",
    });
  });

  it("reads side quests, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const quests = readSideQuests(units);
    expect(quests).toHaveLength(151);
    // The game lists 141 accepted, 139 completed. Futureproof Trading and
    // Presentproof Investing are completed repeat quests, hidden until
    // accepted again.
    const repeats = ["00204106", "00204107"];
    const listed = quests.filter((q) => q.accepted && !repeats.includes(q.id));
    expect(listed).toHaveLength(141);
    expect(listed.filter((q) => q.completed)).toHaveLength(139);
    // Underway: Eureka! They Do Exist! and Chasing Rumors: Red Tri-Stars.
    expect(listed.filter((q) => !q.completed).map((q) => q.id)).toEqual([
      "00290101",
      "00240121",
    ]);
    expect(
      quests.filter((q) => repeats.includes(q.id)).map((q) => q.completed),
    ).toEqual([true, true]);
    // Save the Crustaceans and its 14 sequels, all completed.
    expect(
      quests.filter((q) => /^0029000|^0029001|^00200001$/.test(q.id)),
    ).toSatisfy(
      (list: typeof quests) =>
        list.length === 15 && list.every((q) => q.completed),
    );
  });

  it("reads quest counter quests, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const quests = readCounterQuests(units);
    const quest = (id: string) => quests.find((q) => q.id === id);
    expect(quests).toHaveLength(203);
    // Clears sum to quests cleared on the profile.
    expect(quests.reduce((sum, q) => sum + q.clears, 0)).toBe(
      readProfile(units).questsCleared,
    );
    // Lock Horns, Throw a Smith a Bone, I See a Grim Vision.
    expect(
      ["00407322", "00406364", "00406360"].map((id) => quest(id)?.clears),
    ).toEqual([4105, 1269, 1245]);
    // S+ best: The Juice of Jealousy, Tomorrow's Prayers, Protect Our Woods.
    // S++ on all five On the Threshold quests.
    expect(
      quests.filter((q) => q.clears && !q.perfectGrade).map((q) => q.id),
    ).toEqual(["00403302", "00401316", "00401315"]);
    expect(
      quests
        .filter((q) => q.id.startsWith("0040B"))
        .every((q) => q.perfectGrade),
    ).toBe(true);
    // On the Threshold of Destruction, last cleared 2026-08-17.
    expect(quest("0040B309")?.lastCleared?.toISOString()).toBe(
      "2026-08-17T01:50:50.000Z",
    );
    expect(quest("00406360")?.lastCleared).toBeUndefined();
  });

  it("reads earned trophies, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const earned = new Set(readEarnedTrophies(units));
    const got = (keys: number[]) => keys.map((key) => earned.has(key));
    expect(earned.size).toBe(981);
    // Narmaya: master level 10, {0} and 50 earned, caps 1-4 and devotion not.
    expect(got([951, 952, 953, 954, 955, 956, 957, 958])).toEqual([
      ...[true, true, true],
      ...[false, false, false, false, false],
    ]);
    // Yodarha: all eight master level trophies.
    expect(got([943, 944, 945, 946, 947, 948, 949, 950])).toEqual(
      Array(8).fill(true),
    );
    // Hidden in game: Perfectly Heroic, Hardcore and the 7 dark wee pincers.
    expect(got([15, 16, 1342, 1343, 1344, 1345, 1466, 1487, 1488])).toEqual(
      Array(9).fill(false),
    );
  });

  it("reads journal archives, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const entries = readArchives(units);
    const count = (prefix: string) => {
      const list = entries.filter((e) => e.key.startsWith(prefix));
      return `${list.filter((e) => e.obtained).length}/${list.length}`;
    };
    // Obtained Documents, Records of a Handyman, Classified Records.
    expect([
      count("ARC_OTHER_"),
      count("ARC_ROLAN"),
      count("ARC_LILITH"),
    ]).toEqual(["57/73", "8/8", "5/5"]);
    // The 8 obtained documents with the new mark.
    expect(
      entries
        .filter((e) => e.obtained && !e.viewed)
        .map((e) => e.key)
        .sort(),
    ).toEqual([45, 46, 66, 67, 68, 69, 71, 72].map((n) => `ARC_OTHER_0${n}`));
    // ???: Fishing Tournament Flyer, Aged Document, Seize the Day, Silver Wolves!
    const entry = (key: string) => entries.find((e) => e.key === key);
    for (const key of ["ARC_OTHER_004", "ARC_OTHER_022", "ARC_OTHER_070"])
      expect(entry(key)).toMatchObject({ obtained: false, viewed: false });
  });

  it("reads the journal glossary, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const entries = new Map(readGlossary(units).map((e) => [e.key, e]));
    const entry = (n: string) => entries.get(`TXT_GLOSSARY_TTL_${n}`);
    expect(entries.size).toBe(146);
    expect([...entries.values()].filter((e) => e.listed).length).toBe(142);
    // Missing in game: Moondwellers, Bluesky Knights, The Order of Vane, Silver Wolf Resurgence.
    for (const n of ["0104", "0096", "0097", "0119"])
      expect(entry(n)).toMatchObject({ listed: false, paragraphs: 0 });
    // Sky Realm 1, Folca 2 and Seedhollow Castle 4 paragraphs.
    expect([entry("0000"), entry("0062"), entry("0075")]).toMatchObject(
      [1, 2, 4].map((paragraphs) => ({
        listed: true,
        viewed: true,
        paragraphs,
      })),
    );
    // Ragnalia and Astrum Fragments show the new mark.
    for (const n of ["0125", "0034"])
      expect(entry(n)).toMatchObject({ listed: true, viewed: false });
  });

  it("reads journal tips, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const tips = new Map(readTips(units).map((tip) => [tip.key, tip]));
    expect(tips.size).toBe(328);
    const all = [...tips.values()];
    expect(all.filter((tip) => tip.listed).length).toBe(320);
    expect(all.filter((tip) => tip.listed && !tip.viewed).length).toBe(26);
    // Missing: Dark Wee Pincers, Block List and Report Function in System, Dexterity's Way 2 and 4 in Conflux.
    for (const key of [
      "FE22112B",
      "CEBF5296",
      "CF168BE2",
      "926889B9",
      "BB9BB8F4",
    ])
      expect(tips.get(key)).toMatchObject({ listed: false });
    // New mark: Mastering the Captain 3 and Damage Cap.
    for (const key of ["B885D317", "72DBE9B8"])
      expect(tips.get(key)).toMatchObject({ listed: true, viewed: false });
  });

  it("reads the journal music collection, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const tracks = new Map(readMusic(units).map((track) => [track.key, track]));
    expect(tracks.size).toBe(194);
    const all = [...tracks.values()];
    expect(all.filter((track) => track.listed).length).toBe(193);
    expect(all.filter((track) => track.listed && !track.viewed).length).toBe(
      99,
    );
    // Missing: Jewel Resort Casino Liner.
    expect(tracks.get("12421797")).toMatchObject({ listed: false });
    // New mark on Wind of Beginnings and The Ultimate, none on Clear Horizons.
    for (const key of ["5D71515A", "95CDEE81"])
      expect(tracks.get(key)).toMatchObject({ listed: true, viewed: false });
    expect(tracks.get("NOTE_BGM_080")).toMatchObject({
      listed: true,
      viewed: true,
    });
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
    const count = (key: string) => {
      const counts: Record<string, number> = {};
      for (const cell of character(key)?.masterTraits ?? []) {
        const group = cell.position === undefined ? "perk" : cell.rank;
        counts[group] = (counts[group] ?? 0) + 1;
      }
      return counts;
    };
    // Every point spent: the 10/10/10/20 pools, plus the perks they light.
    expect(count("PL2500")).toEqual({
      perk: 5,
      r1: 10,
      r2: 10,
      r3: 10,
      ex: 20,
    });
    expect(character("PL2600")?.masterTraits).toEqual([]);

    const limits = { r1: 4, r2: 8, r3: 8, ex: 10 };
    for (const cell of character("PL2500")?.masterTraits ?? [])
      if (cell.position !== undefined)
        expect(cell.position).toBeLessThanOrEqual(limits[cell.rank]);
  });

  it("reads masteries, as in game", () => {
    const msp = (key: string) =>
      Object.values(character(key)?.masteries ?? {}).reduce(
        (sum, section) => sum + section.msp,
        0,
      );
    // Every node taken: gbfr-sharecard's per-character MSP totals.
    expect(msp("PL0400")).toBe(966702);
    expect(msp("PL2500")).toBe(967030);
    expect(character("PL2500")?.masteries).toMatchObject({
      offense: { taken: 188, total: 188 },
      offenseExtension: { taken: 25, total: 25 },
      defense: { taken: 142, total: 142 },
      defenseExtension: { taken: 25, total: 25 },
      collection: { taken: 24, total: 24 },
      transcendence: { taken: 24, total: 24 },
    });
    // Offense and Defense to 100%, Collection complete, no transcendence.
    expect(character("PL1200")?.masteries).toEqual({
      offense: { taken: 185, total: 185, msp: 19035 },
      offenseExtension: { taken: 0, total: 25, msp: 0 },
      defense: { taken: 133, total: 133, msp: 15636 },
      defenseExtension: { taken: 0, total: 25, msp: 0 },
      collection: { taken: 36, total: 36, msp: 1104 },
      transcendence: { taken: 0, total: 36, msp: 0 },
    });
    expect(character("PL1800")?.masteries.transcendence).toEqual({
      taken: 36,
      total: 36,
      msp: 12720,
    });
  });

  it("reads fate episodes", () => {
    const completed = (key: string) =>
      character(key)?.fateEpisodes.filter((episode) => episode.completed)
        .length;
    // State 14 on the first three and 30 on the rest, all completed.
    expect(character("PL2500")?.fateEpisodes).toHaveLength(11);
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
    // REMI_PL0200_00 is stored but not in the menu.
    expect(character("PL0200")?.fateEpisodes).toHaveLength(11);
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
