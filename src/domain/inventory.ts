import { ITEM_KEYS, ITEM_SORT_ORDER } from "../data/items";
import {
  GEM_KEYS,
  GEM_TRAITS,
  SKILL_KEYS,
  TRAIT_INVENTORY_SORT_ORDER,
} from "../data/sigils";
import { SUMMON_BASE_PARAM_KEYS } from "../data/summons";
import type { UnitStore } from "../core/unit-store";
import { keyOf } from "./keys";
import {
  ABILITY_FLAGS,
  ABILITY_KEY,
  ABILITY_SEEN,
  CURIO_KEY,
  CURIO_REWARD_ENTRIES,
  CURIO_REWARD_KEY,
  CURIO_REWARD_LEVEL,
  CURIO_REWARD_SEED,
  CURIO_SERIAL,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
  SAVE_WIDE,
  SIGIL_FLAGS,
  SIGIL_KEY,
  SIGIL_LEVEL,
  SIGIL_SLOT_ID,
  SUMMON_FLAGS,
  SUMMON_ID,
  SUMMON_KEY,
  SUMMON_LEVELS,
  SUMMON_TRAIT_AND_BONUS,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_SLOTS_PER_OWNER,
  UNIT,
  USER_MASTERY_POINTS,
  USER_RUPIES,
  WEAPON_APPEARANCE,
  WEAPON_AWAKENING,
  WEAPON_FLAGS,
  WEAPON_KEY,
  WEAPON_PLUS,
  WEAPON_QUESTS_USED,
  WEAPON_SLOT_ID,
  WEAPON_TRAITS,
  WEAPON_TRAIT_SLOTS,
  WEAPON_TRANSCENDENCE,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
  WRIGHTSTONE_FLAGS,
  WRIGHTSTONE_KEY,
  WRIGHTSTONE_LOCKED,
  WRIGHTSTONE_SLOT_ID,
} from "./layout";

export interface Trait {
  /** skill.Key */
  key: string;
  level: number;
}

export interface Sigil {
  /** gem.Key */
  key: string;
  level: number;
  primaryTrait: Trait | undefined;
  secondaryTrait: Trait | undefined;
  locked: boolean;
  /** False while the game marks the sigil as new. */
  seen: boolean;
}

/** item.SortOrder, the inventory's item order; unresolved keys last. */
export const itemOrder = (key: string) => ITEM_SORT_ORDER[key] ?? Infinity;

/** Tabs of the item menu. Sigils, weapons, wrightstones, summons and curios have their own menus. */
export const ITEM_TABS = ["treasures", "keyItems"] as const;
export type ItemTab = (typeof ITEM_TABS)[number];

/** The item menu tab listing an item, by item.SortOrder */
export function itemTab(key: string): ItemTab | undefined {
  const order = ITEM_SORT_ORDER[key];
  if (order === undefined) return undefined;
  if (order >= 100 && order <= 922) return "treasures";
  if (order >= 2000 && order < 3000) return "keyItems";
  return undefined;
}

const traitOrder = (trait: Trait | undefined) =>
  (trait && TRAIT_INVENTORY_SORT_ORDER[trait.key]) ?? Infinity;

/** Inventory order: skill.InventorySortOrder of the first trait, then of the second. */
export const compareSigils = (a: Sigil, b: Sigil) =>
  traitOrder(a.primaryTrait) - traitOrder(b.primaryTrait) ||
  traitOrder(a.secondaryTrait) - traitOrder(b.secondaryTrait);

export interface Wrightstone {
  /** item.Key */
  key: string;
  /** Main trait, then the two sub traits. */
  traits: Trait[];
}

export interface Weapon {
  /** weapon.Key */
  key: string;
  xp: number;
  /** Uncap stage 0-6, an index into weapon_limit. */
  uncap: number;
  plus: number;
  awakening: number;
  transcendence: number;
  /** Times used in a quest. */
  questsUsed: number;
  /** skill.Key per trait slot 1-5, undefined when not unlocked. */
  traits: (string | undefined)[];
  wrightstone: Wrightstone | undefined;
  /** weapon.Key of the look chosen for the weapon, undefined for its own. */
  appearance: string | undefined;
  /** False while the transwakening menu marks the weapon as new. */
  seen: boolean;
  /** Seen in the upgrade menu, set only on awakenable weapons. */
  awakeningSeen: boolean;
}

export interface InventoryWrightstone extends Wrightstone {
  locked: boolean;
  /** False while the game marks the stone as new. */
  seen: boolean;
}

/** A curio's reward, rolled when the curio is found. */
export type CurioReward =
  | { type: "material"; /** item.Key */ key: string }
  | {
      type: "sigil";
      /** gem.Key */ key: string;
      level: number;
      /** The sigil's own traits, skill.Key of gem.SkillId1 then SkillId2. */
      traits: string[];
      /** Seed of the trait the sigil rolls at appraisal, 0 on a gem with two. */
      seed: number;
    }
  | { type: "wrightstone"; /** item.Key */ key: string; seed: number };

export interface Curio {
  /** item.Key of the curio tier, ITEM_19_0001-0004. */
  key: string;
  /** 1-4, the tier in the item.Key; undefined when the key is unresolved. */
  tier: number | undefined;
  /** Its number in the order curios were found, counting up across the save. */
  serial: number;
  reward: CurioReward | undefined;
}

export interface EquipBonus {
  /** summon_base_param.Key */
  key: string;
  /** 0-9, reads summon_base_param.Level<level + 1>Value. */
  level: number;
}

export interface Summon {
  /** summon.Key */
  key: string;
  trait: Trait | undefined;
  equipBonus: EquipBonus | undefined;
  /** Equipped at least once. */
  everEquipped: boolean;
  /** False while the game marks the summon as new. */
  seen: boolean;
}

export interface Inventory {
  rupies: number;
  masteryPoints: number;
  /** Count by item.Key. Wrightstones are listed apart. */
  items: Map<string, number>;
  /** item.Key of the items on the wish list, in save order. */
  wishList: string[];
  /**
   * item.Key of held items not yet seen. Includes items the item menu does not
   * show, such as potions and wrightstone items.
   */
  unseenItems: string[];
  /**
   * ability.Key of abilities in a character's list not yet seen, guest
   * characters included. Abilities a character has not got hold 0 and are left out.
   */
  unseenAbilities: string[];
  /** Oldest first, the order the game appraises them in. */
  curios: Curio[];
  /** By slot id. */
  wrightstones: Map<number, InventoryWrightstone>;
  /** By slot id, the value equipment units reference. */
  sigils: Map<number, Sigil>;
  weapons: Map<number, Weapon>;
  /** By summon id, the value 1451 references. */
  summons: Map<number, Summon>;
}

/** Traits stored for one owner, empty slots kept as undefined. */
function readTraits(units: UnitStore, owner: number): (Trait | undefined)[] {
  const range = {
    first: UNIT.TRAIT + owner * TRAIT_SLOTS_PER_OWNER,
    count: TRAIT_SLOTS_PER_OWNER,
  };
  return units.entitiesWith(TRAIT_KEY, range).map((entity) => {
    const at = units.of(entity);
    const key = at.get(TRAIT_KEY);
    return key === undefined ? undefined : { key, level: at.get(TRAIT_LEVEL) };
  });
}

function readSigils(units: UnitStore): Map<number, Sigil> {
  const sigils = new Map<number, Sigil>();
  for (const entity of units.entitiesWith(SIGIL_SLOT_ID)) {
    const at = units.of(entity);
    const slotId = at.get(SIGIL_SLOT_ID);
    const key = at.get(SIGIL_KEY);
    if (!slotId || key === undefined) continue;
    const [primaryTrait, secondaryTrait] = readTraits(
      units,
      entity - UNIT.SIGIL,
    );
    sigils.set(slotId, {
      key,
      level: at.get(SIGIL_LEVEL),
      primaryTrait,
      secondaryTrait,
      ...at.get(SIGIL_FLAGS),
    });
  }
  return sigils;
}

function readWeapons(units: UnitStore): Map<number, Weapon> {
  const weapons = new Map<number, Weapon>();
  for (const entity of units.entitiesWith(WEAPON_SLOT_ID)) {
    const at = units.of(entity);
    const slotId = at.get(WEAPON_SLOT_ID);
    const key = at.get(WEAPON_KEY);
    if (!slotId || key === undefined) continue;
    const stoneKey = at.get(WEAPON_WRIGHTSTONE);
    const traits = readTraits(
      units,
      UNIT.TRAIT_OWNER_WEAPON + entity - UNIT.WEAPON,
    ).filter((trait): trait is Trait => trait !== undefined);
    const slotTraits = at.get(WEAPON_TRAITS);
    weapons.set(slotId, {
      key,
      xp: at.get(WEAPON_XP),
      uncap: at.get(WEAPON_UNCAP),
      plus: at.get(WEAPON_PLUS),
      awakening: at.get(WEAPON_AWAKENING),
      transcendence: at.get(WEAPON_TRANSCENDENCE),
      questsUsed: at.get(WEAPON_QUESTS_USED),
      traits: Array.from({ length: WEAPON_TRAIT_SLOTS }, (_, i) =>
        keyOf(SKILL_KEYS, slotTraits[i]),
      ),
      wrightstone:
        stoneKey === undefined ? undefined : { key: stoneKey, traits },
      appearance: at.get(WEAPON_APPEARANCE),
      ...at.get(WEAPON_FLAGS),
    });
  }
  return weapons;
}

function readItems(units: UnitStore): Map<string, number> {
  const items = new Map<string, number>();
  for (const entity of units.entitiesWith(ITEM_KEY)) {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    if (key === undefined) continue;
    items.set(key, at.get(ITEM_COUNT));
  }
  return items;
}

/** item.Key of the items whose ITEM_FLAGS match. */
function readItemsFlagged(
  units: UnitStore,
  match: (
    flags: { wishList: boolean; fieldNote: boolean; seen: boolean },
    count: number,
  ) => boolean,
): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(ITEM_KEY)) {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    if (key !== undefined && match(at.get(ITEM_FLAGS), at.get(ITEM_COUNT)))
      keys.push(key);
  }
  return keys;
}

function readUnseenAbilities(units: UnitStore): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(ABILITY_KEY)) {
    const at = units.of(entity);
    const key = at.get(ABILITY_KEY);
    const flags = at.get(ABILITY_FLAGS);
    if (key !== undefined && flags !== 0 && (flags & ABILITY_SEEN) === 0)
      keys.push(key);
  }
  return keys;
}

function readCurioReward(
  units: UnitStore,
  curioEntity: number,
): CurioReward | undefined {
  for (let entry = 0; entry < CURIO_REWARD_ENTRIES; entry++) {
    const at = units.of(curioEntity * 100 + entry);
    const hash = at.get(CURIO_REWARD_KEY);
    const seed = at.get(CURIO_REWARD_SEED);
    if (entry === 1) {
      const key = keyOf(GEM_KEYS, hash);
      if (key === undefined) continue;
      return {
        type: "sigil",
        key,
        level: at.get(CURIO_REWARD_LEVEL),
        traits: [...(GEM_TRAITS[key] ?? [])],
        seed,
      };
    }
    const key = keyOf(ITEM_KEYS, hash);
    if (key === undefined) continue;
    return entry === 3
      ? { type: "wrightstone", key, seed }
      : { type: "material", key };
  }
  return undefined;
}

function readCurios(units: UnitStore): Curio[] {
  const curios: Curio[] = [];
  for (const entity of units.entitiesWith(CURIO_KEY)) {
    const at = units.of(entity);
    const key = at.get(CURIO_KEY);
    if (key === undefined) continue;
    const tier = /^ITEM_19_000(\d)$/.exec(key)?.[1];
    curios.push({
      key,
      tier: tier === undefined ? undefined : Number(tier),
      serial: at.get(CURIO_SERIAL),
      reward: readCurioReward(units, entity),
    });
  }
  return curios;
}

function readWrightstones(units: UnitStore): Map<number, InventoryWrightstone> {
  const stones = new Map<number, InventoryWrightstone>();
  for (const entity of units.entitiesWith(WRIGHTSTONE_KEY)) {
    const at = units.of(entity);
    const key = at.get(WRIGHTSTONE_KEY);
    const slotId = at.get(WRIGHTSTONE_SLOT_ID);
    if (!slotId || key === undefined) continue;
    stones.set(slotId, {
      key,
      traits: readTraits(
        units,
        UNIT.TRAIT_OWNER_WRIGHTSTONE + entity - UNIT.WRIGHTSTONE,
      ).filter((trait): trait is Trait => trait !== undefined),
      locked: at.get(WRIGHTSTONE_LOCKED),
      seen: at.get(WRIGHTSTONE_FLAGS).seen,
    });
  }
  return stones;
}

function readSummons(units: UnitStore): Map<number, Summon> {
  const summons = new Map<number, Summon>();
  for (const entity of units.entitiesWith(SUMMON_ID)) {
    const at = units.of(entity);
    const id = at.get(SUMMON_ID);
    const key = at.get(SUMMON_KEY);
    if (!id || key === undefined) continue;
    const [traitHash, bonusHash] = at.get(SUMMON_TRAIT_AND_BONUS);
    const [traitLevel = 0, bonusLevel = 0] = at.get(SUMMON_LEVELS);
    const traitKey = keyOf(SKILL_KEYS, traitHash);
    const bonusKey = keyOf(SUMMON_BASE_PARAM_KEYS, bonusHash);
    summons.set(id, {
      key,
      trait:
        traitKey === undefined
          ? undefined
          : { key: traitKey, level: traitLevel },
      equipBonus:
        bonusKey === undefined
          ? undefined
          : { key: bonusKey, level: bonusLevel },
      ...at.get(SUMMON_FLAGS),
    });
  }
  return summons;
}

export function readInventory(units: UnitStore): Inventory {
  const at = units.of(SAVE_WIDE);
  return {
    rupies: at.get(USER_RUPIES),
    masteryPoints: at.get(USER_MASTERY_POINTS),
    items: readItems(units),
    wishList: readItemsFlagged(units, (flags) => flags.wishList),
    unseenItems: readItemsFlagged(
      units,
      (flags, count) => count > 0 && !flags.seen,
    ),
    unseenAbilities: readUnseenAbilities(units),
    curios: readCurios(units),
    wrightstones: readWrightstones(units),
    sigils: readSigils(units),
    weapons: readWeapons(units),
    summons: readSummons(units),
  };
}
