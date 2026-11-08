import { type UnitEntity, type UnitStore, SAVE_ENTITY } from "@gbfr/core";
import { WEAPON_LEVEL_XP, WEAPON_ROWS } from "./data.gen";
import type { Patch, SaveSession } from "@gbfr/core/session";
import { clearTraits } from "@gbfr/trait/edit";
import { TRAIT_WEAPON } from "@gbfr/trait";
import {
  findWeaponById,
  unlockableWeapons,
  WEAPON_LAST_XP,
  type Weapon,
} from "./read";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_LAST_UNCAP,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "./attributes";

/** Patches adding one weapon as a forge does, at no cost. */
export function forgeWeapon(
  units: UnitStore,
  character: UnitEntity,
  key: string,
): Patch[] {
  if (!unlockableWeapons(units, character).some((w) => w.key === key))
    throw new Error(`character ${character} cannot unlock ${key}`);
  const [uncap, level] = WEAPON_ROWS[key]!.forged!;
  const entity = units.entitiesWhere(WEAPON_ID, 0)[0];
  if (entity === undefined) throw new Error("no free weapon entry");
  const id = units.of(SAVE_ENTITY).get(WEAPON_LAST_ID) + 1;
  const weapon = units.of(entity);
  return [
    units.of(SAVE_ENTITY).patch(WEAPON_LAST_ID, id),
    weapon.patch(WEAPON_ID, id),
    weapon.patch(WEAPON_KEY, key),
    weapon.patch(WEAPON_XP, WEAPON_LEVEL_XP[level - 1]!),
    weapon.patch(WEAPON_UNCAP, uncap),
    weapon.replace(WEAPON_FLAGS, { forged: true }),
  ];
}

/** Patches raising weapons to the last uncap and level. */
export const raiseWeapons = (
  units: UnitStore,
  weapons: readonly Weapon[],
): Patch[] =>
  weapons.flatMap(({ entity }) => [
    units.of(entity).patch(WEAPON_UNCAP, WEAPON_LAST_UNCAP),
    units.of(entity).patch(WEAPON_XP, WEAPON_LAST_XP),
  ]);

export function removeWrightstone(session: SaveSession, weaponId: number) {
  const units = session.save.slotData.units;
  const entity = findWeaponById(units, weaponId);
  if (entity === undefined) throw new Error(`no weapon with id ${weaponId}`);
  if (units.of(entity).get(WEAPON_WRIGHTSTONE) === undefined)
    throw new Error(`weapon ${weaponId} has no wrightstone`);

  session.patch([
    units.of(entity).patch(WEAPON_WRIGHTSTONE, undefined),
    ...clearTraits(units, TRAIT_WEAPON + entity - WEAPON_FIRST),
  ]);
}
