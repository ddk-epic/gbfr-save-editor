import { WEAPON_LEVEL_XP, WEAPON_ROWS } from "../../data/weapons";
import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { SKILLS, TRAIT_WEAPON } from "../trait/attributes";
import { readFilledTraits } from "../trait/read";
import { SAVE_ENTITY } from "../../core/save-entity";
import { USER_CAPTAIN } from "../user/attributes";
import type { Wrightstone } from "../wrightstone/read";
import {
  COLLECTION_SERIES,
  WEAPON_APPEARANCE,
  WEAPON_AWAKENING,
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_PLUS,
  WEAPON_QUESTS_USED,
  WEAPON_TRAITS,
  WEAPON_TRAIT_POSITIONS,
  WEAPON_TRANSCENDENCE,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "./attributes";

export interface Weapon {
  entity: UnitEntity;
  id: number;
  /** weapon.Key */
  key: string;
  xp: number;
  /** Uncap stage 0-6, an index into weapon_limit. */
  uncap: number;
  plus: number;
  awakening: number;
  transcendence: number;
  questsUsed: number;
  /** skill.Key per trait position 1-5, undefined when not unlocked. */
  traits: (string | undefined)[];
  wrightstone: Wrightstone | undefined;
  /** weapon.Key of the look chosen for the weapon, undefined for its own. */
  appearance: string | undefined;
  /** Obtainable and not the copy of the captain not in play. */
  owned: boolean;
  /** Weapon series, the gt() weaponSeries key, undefined for a key off the table. */
  series: number | undefined;
  /** chara.CharId of the owner, from weapon.CharaId, undefined for a key off the table. */
  character: string | undefined;
  /** False while the transwakening menu marks the weapon as new. */
  seen: boolean;
  /** Seen in the upgrade menu, set only on awakenable weapons. */
  awakeningSeen: boolean;
}

export const offPlayCaptain = (units: UnitStore) => {
  const captain = units.of(SAVE_ENTITY).get(USER_CAPTAIN);
  return captain === 1 ? "PL0100" : captain === 2 ? "PL0000" : undefined;
};

export function readWeapon(
  units: UnitStore,
  entity: UnitEntity,
): Weapon | undefined {
  const at = units.of(entity);
  const id = at.get(WEAPON_ID);
  const key = at.get(WEAPON_KEY);
  if (!id || key === undefined) return undefined;

  const row = WEAPON_ROWS[key];
  const stoneKey = at.get(WEAPON_WRIGHTSTONE);
  // The stone welded onto the weapon keeps its traits in the weapon's own list.
  const traits = readFilledTraits(units, TRAIT_WEAPON + entity - WEAPON_FIRST);
  const positionTraits = at.get(WEAPON_TRAITS);
  return {
    entity,
    id,
    key,
    xp: at.get(WEAPON_XP),
    uncap: at.get(WEAPON_UNCAP),
    plus: at.get(WEAPON_PLUS),
    awakening: at.get(WEAPON_AWAKENING),
    transcendence: at.get(WEAPON_TRANSCENDENCE),
    questsUsed: at.get(WEAPON_QUESTS_USED),
    traits: Array.from({ length: WEAPON_TRAIT_POSITIONS }, (_, i) =>
      keyOf(SKILLS, positionTraits[i]),
    ),
    wrightstone: stoneKey === undefined ? undefined : { key: stoneKey, traits },
    appearance: at.get(WEAPON_APPEARANCE),
    series: row?.series,
    character: row?.character,
    owned: row?.obtainable === true && row.character !== offPlayCaptain(units),
    ...at.get(WEAPON_FLAGS),
  };
}

/** The level `xp` reaches. */
export const weaponLevelOf = (xp: number) =>
  WEAPON_LEVEL_XP.filter((needed) => needed <= xp).length;

/** By weapon id. */
export function readWeapons(units: UnitStore): Map<number, Weapon> {
  const weapons = new Map<number, Weapon>();
  for (const entity of units.entitiesWith(WEAPON_ID)) {
    const weapon = readWeapon(units, entity);
    if (weapon) weapons.set(weapon.id, weapon);
  }
  return weapons;
}

export function readOwnedWeapons(
  units: UnitStore,
): Map<string, Map<number, Weapon>> {
  const owned = new Map<string, Map<number, Weapon>>();
  for (const weapon of readWeapons(units).values()) {
    const { character, series } = weapon;
    if (!weapon.owned || character === undefined || series === undefined)
      continue;
    if (!COLLECTION_SERIES.includes(series)) continue;
    let bySeries = owned.get(character);
    if (!bySeries) owned.set(character, (bySeries = new Map()));
    if (!bySeries.has(series)) bySeries.set(series, weapon);
  }
  return owned;
}

export const findWeaponById = (
  units: UnitStore,
  id: number,
): UnitEntity | undefined => units.entitiesWhere(WEAPON_ID, id)[0];
