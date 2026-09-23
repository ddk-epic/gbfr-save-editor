import { describe, expect, it } from "vitest";
import { CHARACTER_KEYS } from "../../src/data/characters";
import { MASTERY_SECTIONS } from "../../src/data/masteries";
import type {
  MasteryProgress,
  MasterySection,
} from "../../src/domains/mastery/read";
import type { CounterQuest } from "../../src/domains/quest/read";
import type { Weapon } from "../../src/domains/weapon/read";
import type { Wrightstone } from "../../src/domains/wrightstone/read";
import type {
  Character,
  CharacterData,
  Loadout,
} from "../../src/read/characters";
import type { Inventory } from "../../src/read/inventory";
import {
  validateCharacterData,
  validateInventory,
  validateQuestClears,
} from "../../src/read/validate";

const CHARACTER_COUNT = Object.keys(CHARACTER_KEYS).length;

/** Every section at zero, as a character with no ap_tree rows reads. */
const noMasteries = (): Record<MasterySection, MasteryProgress> =>
  Object.fromEntries(
    MASTERY_SECTIONS.map((section): [MasterySection, MasteryProgress] => [
      section,
      { taken: 0, total: 0, msp: 0, nodes: [] },
    ]),
  ) as Record<MasterySection, MasteryProgress>;

const character = (
  key: string,
  fields: Partial<Character> = {},
): Character => ({
  entity: 0,
  character: key,
  weapon: undefined,
  sigils: [],
  skills: [],
  level: 1,
  xp: 0,
  baseHp: 0,
  baseAttack: 0,
  questsUsed: 0,
  masterXp: 0,
  masterLevel: 0,
  overMasteries: [],
  masterTraits: [],
  masteries: noMasteries(),
  fateEpisodes: [],
  ...fields,
});

const loadout = (key: string): Loadout => ({
  ...character(key),
  name: "loadout",
});

const characterData = (fields: Partial<CharacterData>): CharacterData => ({
  captain: "PL0000",
  characters: Object.values(CHARACTER_KEYS).map((key) => character(key)),
  party: [],
  partySets: [],
  summons: [],
  loadouts: [],
  ...fields,
});

const inventory = (fields: Partial<Inventory>): Inventory => ({
  rupies: 0,
  masteryPoints: 0,
  items: new Map(),
  wishList: [],
  unseenItems: [],
  unseenAbilities: [],
  curios: [],
  wrightstones: new Map(),
  weapons: new Map(),
  summons: new Map(),
  sigils: new Map(),
  ...fields,
});

const weapon = (id: number, wrightstone: Wrightstone | undefined): Weapon => ({
  entity: id,
  id,
  key: "WP0000",
  xp: 0,
  uncap: 0,
  plus: 0,
  awakening: 0,
  transcendence: 0,
  questsUsed: 0,
  traits: [],
  wrightstone,
  appearance: undefined,
  owned: true,
  seen: true,
  awakeningSeen: true,
});

const quest = (clears: number): CounterQuest => ({
  id: "00A10001",
  difficulty: undefined,
  clears,
  grade: undefined,
  lastCleared: undefined,
});

describe("validateCharacterData", () => {
  it("warns when the save holds fewer characters than the table", () => {
    expect(
      validateCharacterData(characterData({ characters: [] })),
    ).toContainEqual({
      severity: "warning",
      code: "tableCount",
      table: "chara",
      held: 0,
      expected: CHARACTER_COUNT,
    });
  });

  it("warns on a party member or loadout naming an unknown character", () => {
    expect(
      validateCharacterData(
        characterData({
          party: ["PL0000", "#12345678", undefined],
          loadouts: [loadout("PL9999")],
        }),
      ),
    ).toEqual([
      {
        severity: "warning",
        code: "unknownCharacter",
        where: "party",
        key: "#12345678",
      },
      {
        severity: "warning",
        code: "unknownCharacter",
        where: "loadout",
        key: "PL9999",
      },
    ]);
  });
});

describe("validateInventory", () => {
  const items = new Map([["ITEM_11_0000", 1]]);

  it("warns on a list naming an item the inventory does not hold", () => {
    const issues = validateInventory(
      inventory({
        items,
        wishList: ["ITEM_11_0001"],
        unseenItems: ["ITEM_11_0002"],
      }),
    );
    expect(issues).toContainEqual({
      severity: "warning",
      code: "itemNotHeld",
      list: "wishList",
      key: "ITEM_11_0001",
    });
    expect(issues).toContainEqual({
      severity: "warning",
      code: "itemNotHeld",
      list: "unseenItems",
      key: "ITEM_11_0002",
    });
  });

  it("checks a weapon's welded stone as well as loose stones", () => {
    const traits = [20, 10, 5, 1].map((level, i) => ({
      entity: i,
      key: "SKILL",
      level,
    }));
    const issues = validateInventory(
      inventory({
        items,
        weapons: new Map([[7, weapon(7, { key: "ITEM_28_0000", traits })]]),
      }),
    );
    expect(issues).toContainEqual({
      severity: "reject",
      code: "tooManyTraits",
      holder: "weapon",
      id: 7,
      count: 4,
      max: 3,
    });
  });
});

describe("validateQuestClears", () => {
  const quests = [quest(3), quest(4)];

  it("passes clears adding up to the profile's count", () => {
    expect(validateQuestClears(quests, 7)).toEqual([]);
  });

  it("rejects a sum the profile does not agree with", () => {
    expect(validateQuestClears(quests, 8)).toEqual([
      { severity: "reject", code: "questClearsMismatch", sum: 7, profile: 8 },
    ]);
  });
});
