import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { SKILLS, TRAIT_WEAPON } from "../trait/attributes";
import { readFilledTraits } from "../trait/read";
import type { Wrightstone } from "../wrightstone/read";
import {
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
  /** False while the transwakening menu marks the weapon as new. */
  seen: boolean;
  /** Seen in the upgrade menu, set only on awakenable weapons. */
  awakeningSeen: boolean;
}

export function readWeapon(
  units: UnitStore,
  entity: UnitEntity,
): Weapon | undefined {
  const at = units.of(entity);
  const id = at.get(WEAPON_ID);
  const key = at.get(WEAPON_KEY);
  if (!id || key === undefined) return undefined;

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
    ...at.get(WEAPON_FLAGS),
  };
}

/** By weapon id. */
export function readWeapons(units: UnitStore): Map<number, Weapon> {
  const weapons = new Map<number, Weapon>();
  for (const entity of units.entitiesWith(WEAPON_ID)) {
    const weapon = readWeapon(units, entity);
    if (weapon) weapons.set(weapon.id, weapon);
  }
  return weapons;
}

export const findWeaponById = (
  units: UnitStore,
  id: number,
): UnitEntity | undefined => units.entitiesWhere(WEAPON_ID, id)[0];
