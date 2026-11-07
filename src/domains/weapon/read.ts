import { WEAPON_LEVEL_XP, WEAPON_ROWS } from "../../data/weapons";
import { CHARACTER_KEY } from "../character/attributes";
import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { SKILLS } from "../../tables/skills";
import { TRAIT_WEAPON } from "../trait/attributes";
import { readFilledTraits } from "../trait/read";
import { offPlayCaptain } from "../character/read";
import type { Wrightstone } from "../wrightstone/read";
import {
  COLLECTION_SERIES,
  WEAPON_APPEARANCE,
  WEAPON_AWAKENING,
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_LEVEL,
  WEAPON_LAST_UNCAP,
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
  const flags = at.get(WEAPON_FLAGS);
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
    seen: flags.seen,
    awakeningSeen: flags.awakeningSeen,
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

export const WEAPON_LAST_XP = WEAPON_LEVEL_XP[WEAPON_LAST_LEVEL - 1]!;

/** The weapons a character can still gain, one per missing series. */
export function unlockableWeapons(units: UnitStore, character: UnitEntity) {
  const owner = units.of(character).get(CHARACTER_KEY);
  if (owner === undefined || owner === offPlayCaptain(units)) return [];
  const held = readOwnedWeapons(units).get(owner);
  return Object.entries(WEAPON_ROWS)
    .filter(
      ([, row]) =>
        row.forged && row.character === owner && !held?.has(row.series),
    )
    .map(([key, { series }]) => ({ key, series }))
    .sort(
      (a, b) =>
        COLLECTION_SERIES.indexOf(a.series) -
        COLLECTION_SERIES.indexOf(b.series),
    );
}

/** A character's held weapons and those short of the last uncap or level, undefined when none are held. */
export function raisableWeapons(units: UnitStore, character: string) {
  const held = [...(readOwnedWeapons(units).get(character)?.values() ?? [])];
  if (held.length === 0) return undefined;
  const raised = held.filter(
    ({ uncap, xp }) => uncap < WEAPON_LAST_UNCAP || xp < WEAPON_LAST_XP,
  );
  return { held, raised };
}
