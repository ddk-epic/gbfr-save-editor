import { ITEM_KEYS } from "../data/items";
import { GEM_KEYS, SKILL_KEYS } from "../data/sigils";
import { ABILITY_KEYS } from "../data/skills";
import { SUMMON_BASE_PARAM_KEYS, SUMMON_KEYS } from "../data/summons";
import { WEAPON_KEYS } from "../data/weapons";
import type { UnitStore } from "../format/unit-store";
import { keyOf } from "./keys";
import {
  ABILITY_SEEN,
  CURIO_REWARD_ENTRIES,
  SIGIL_LOCKED,
  SIGIL_SEEN,
  WRIGHTSTONE_SEEN,
  ITEM_WISH_LIST,
  ITEM_SEEN,
  WEAPON_SEEN,
  SUMMON_EVER_EQUIPPED,
  SUMMON_SEEN,
  WEAPON_AWAKENING_SEEN,
  ID,
  UNIT,
  WEAPON_TRAIT_SLOTS,
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
  | { kind: "material"; /** item.Key */ key: string }
  | { kind: "sigil"; /** gem.Key */ key: string; level: number }
  | { kind: "wrightstone"; /** item.Key */ key: string };

export interface Curio {
  /** item.Key of the curio tier, ITEM_19_0001-0004. */
  key: string;
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

const first = (units: UnitStore, idType: number, unitId: number) =>
  units.values(idType, unitId, "uint")?.[0];

/** Traits stored for one owner, empty entries dropped. */
function readTraits(units: UnitStore, owner: number): (Trait | undefined)[] {
  const traits: (Trait | undefined)[] = [];
  for (let i = 0; ; i++) {
    const unitId = UNIT.TRAIT + owner * 100 + i;
    const hash = first(units, ID.TRAIT_KEY, unitId);
    if (hash === undefined) return traits;
    const key = keyOf(SKILL_KEYS, hash);
    const level = units.values(ID.TRAIT_LEVEL, unitId, "int")?.[0] ?? 0;
    traits.push(key === undefined ? undefined : { key, level });
  }
}

function readSigils(units: UnitStore): Map<number, Sigil> {
  const sigils = new Map<number, Sigil>();
  for (const unit of units.ofIdType(ID.SIGIL_SLOT_ID)) {
    const slotId = (unit.values as number[])[0];
    const key = keyOf(GEM_KEYS, first(units, ID.SIGIL_KEY, unit.unitId));
    if (!slotId || key === undefined) continue;
    const flags = first(units, ID.SIGIL_FLAGS, unit.unitId) ?? 0;
    const [primaryTrait, secondaryTrait] = readTraits(
      units,
      unit.unitId - UNIT.SIGIL,
    );
    sigils.set(slotId, {
      key,
      level: units.values(ID.SIGIL_LEVEL, unit.unitId, "int")?.[0] ?? 0,
      primaryTrait,
      secondaryTrait,
      locked: (flags & SIGIL_LOCKED) !== 0,
      seen: (flags & SIGIL_SEEN) !== 0,
    });
  }
  return sigils;
}

function readWeapons(units: UnitStore): Map<number, Weapon> {
  const weapons = new Map<number, Weapon>();
  for (const unit of units.ofIdType(ID.WEAPON_SLOT_ID)) {
    const slotId = (unit.values as number[])[0];
    const key = keyOf(WEAPON_KEYS, first(units, ID.WEAPON_KEY, unit.unitId));
    if (!slotId || key === undefined) continue;
    const stoneKey = keyOf(
      ITEM_KEYS,
      first(units, ID.WEAPON_WRIGHTSTONE, unit.unitId),
    );
    const traits = readTraits(
      units,
      UNIT.TRAIT_OWNER_WEAPON + unit.unitId - UNIT.WEAPON,
    ).filter((trait): trait is Trait => trait !== undefined);
    const int = (idType: number) =>
      units.values(idType, unit.unitId, "int")?.[0] ?? 0;
    const slotTraits = units.values(ID.WEAPON_TRAITS, unit.unitId, "uint");
    const flags = first(units, ID.WEAPON_FLAGS, unit.unitId) ?? 0;
    weapons.set(slotId, {
      key,
      xp: first(units, ID.WEAPON_XP, unit.unitId) ?? 0,
      uncap: int(ID.WEAPON_UNCAP),
      plus: int(ID.WEAPON_PLUS),
      awakening: int(ID.WEAPON_AWAKENING),
      transcendence: int(ID.WEAPON_TRANSCENDENCE),
      questsUsed: first(units, ID.WEAPON_QUESTS_USED, unit.unitId) ?? 0,
      traits: Array.from({ length: WEAPON_TRAIT_SLOTS }, (_, i) =>
        keyOf(SKILL_KEYS, slotTraits?.[i]),
      ),
      wrightstone:
        stoneKey === undefined ? undefined : { key: stoneKey, traits },
      appearance: keyOf(
        WEAPON_KEYS,
        first(units, ID.WEAPON_APPEARANCE, unit.unitId),
      ),
      seen: (flags & WEAPON_SEEN) !== 0,
      awakeningSeen: (flags & WEAPON_AWAKENING_SEEN) !== 0,
    });
  }
  return weapons;
}

function readItems(units: UnitStore): Map<string, number> {
  const items = new Map<string, number>();
  for (const unit of units.ofIdType(ID.ITEM_KEY)) {
    const key = keyOf(ITEM_KEYS, (unit.values as number[])[0]);
    if (key === undefined) continue;
    items.set(key, units.values(ID.ITEM_COUNT, unit.unitId, "int")?.[0] ?? 0);
  }
  return items;
}

/** item.Key of the items whose ITEM_FLAGS match. */
function readItemsFlagged(
  units: UnitStore,
  match: (flags: number, count: number) => boolean,
): string[] {
  const keys: string[] = [];
  for (const unit of units.ofIdType(ID.ITEM_KEY)) {
    const key = keyOf(ITEM_KEYS, (unit.values as number[])[0]);
    const flags = first(units, ID.ITEM_FLAGS, unit.unitId) ?? 0;
    const count = units.values(ID.ITEM_COUNT, unit.unitId, "int")?.[0] ?? 0;
    if (key !== undefined && match(flags, count)) keys.push(key);
  }
  return keys;
}

function readUnseenAbilities(units: UnitStore): string[] {
  const keys: string[] = [];
  for (const unit of units.ofIdType(ID.ABILITY_KEY)) {
    const key = keyOf(ABILITY_KEYS, (unit.values as number[])[0]);
    const flags = first(units, ID.ABILITY_FLAGS, unit.unitId) ?? 0;
    if (key !== undefined && flags !== 0 && (flags & ABILITY_SEEN) === 0)
      keys.push(key);
  }
  return keys;
}

function readCurioReward(
  units: UnitStore,
  curioUnit: number,
): CurioReward | undefined {
  for (let entry = 0; entry < CURIO_REWARD_ENTRIES; entry++) {
    const unitId = curioUnit * 100 + entry;
    const hash = first(units, ID.CURIO_REWARD_KEY, unitId);
    if (entry === 1) {
      const key = keyOf(GEM_KEYS, hash);
      if (key === undefined) continue;
      const level =
        units.values(ID.CURIO_REWARD_LEVEL, unitId, "int")?.[0] ?? 0;
      return { kind: "sigil", key, level };
    }
    const key = keyOf(ITEM_KEYS, hash);
    if (key === undefined) continue;
    return { kind: entry === 3 ? "wrightstone" : "material", key };
  }
  return undefined;
}

function readCurios(units: UnitStore): Curio[] {
  const curios: Curio[] = [];
  for (const unit of units.ofIdType(ID.CURIO_KEY)) {
    const key = keyOf(ITEM_KEYS, (unit.values as number[])[0]);
    if (key === undefined) continue;
    curios.push({ key, reward: readCurioReward(units, unit.unitId) });
  }
  return curios;
}

function readWrightstones(units: UnitStore): Map<number, InventoryWrightstone> {
  const stones = new Map<number, InventoryWrightstone>();
  for (const unit of units.ofIdType(ID.WRIGHTSTONE_KEY)) {
    const key = keyOf(ITEM_KEYS, (unit.values as number[])[0]);
    const slotId = first(units, ID.WRIGHTSTONE_SLOT_ID, unit.unitId);
    if (!slotId || key === undefined) continue;
    stones.set(slotId, {
      key,
      traits: readTraits(
        units,
        UNIT.TRAIT_OWNER_WRIGHTSTONE + unit.unitId - UNIT.WRIGHTSTONE,
      ).filter((trait): trait is Trait => trait !== undefined),
      locked:
        units.values(ID.WRIGHTSTONE_LOCKED, unit.unitId, "bool")?.[0] ?? false,
      seen:
        ((first(units, ID.WRIGHTSTONE_FLAGS, unit.unitId) ?? 0) &
          WRIGHTSTONE_SEEN) !==
        0,
    });
  }
  return stones;
}

function readSummons(units: UnitStore): Map<number, Summon> {
  const summons = new Map<number, Summon>();
  for (const unit of units.ofIdType(ID.SUMMON_ID)) {
    const id = (unit.values as number[])[0];
    const key = keyOf(SUMMON_KEYS, first(units, ID.SUMMON_KEY, unit.unitId));
    if (!id || key === undefined) continue;
    const [traitHash, bonusHash] =
      units.values(ID.SUMMON_TRAIT_AND_BONUS, unit.unitId, "uint") ?? [];
    const [traitLevel = 0, bonusLevel = 0] =
      units.values(ID.SUMMON_LEVELS, unit.unitId, "int") ?? [];
    const traitKey = keyOf(SKILL_KEYS, traitHash);
    const bonusKey = keyOf(SUMMON_BASE_PARAM_KEYS, bonusHash);
    const flags = first(units, ID.SUMMON_FLAGS, unit.unitId) ?? 0;
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
      everEquipped: (flags & SUMMON_EVER_EQUIPPED) !== 0,
      seen: (flags & SUMMON_SEEN) !== 0,
    });
  }
  return summons;
}

export function readInventory(units: UnitStore): Inventory {
  const int = (idType: number) => units.values(idType, 0, "int")?.[0] ?? 0;
  return {
    rupies: int(ID.RUPIES),
    masteryPoints: int(ID.MASTERY_POINTS),
    items: readItems(units),
    wishList: readItemsFlagged(
      units,
      (flags) => (flags & ITEM_WISH_LIST) !== 0,
    ),
    unseenItems: readItemsFlagged(
      units,
      (flags, count) => count > 0 && (flags & ITEM_SEEN) === 0,
    ),
    unseenAbilities: readUnseenAbilities(units),
    curios: readCurios(units),
    wrightstones: readWrightstones(units),
    sigils: readSigils(units),
    weapons: readWeapons(units),
    summons: readSummons(units),
  };
}
