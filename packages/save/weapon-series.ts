import type { Save, UnitEntity, Units } from "@gbfr/core";
import { CHARACTER_KEY } from "@gbfr/character";
import { raisedWeaponTrophies } from "@gbfr/trophy";
import { canUnlockWeaponSeries, raisableWeapons } from "@gbfr/weapon";

/** The writes `maxWeaponSeries` makes on a character's held weapons. */
export function planWeaponSeries(units: Units, character: UnitEntity) {
  const key = units.of(character).get(CHARACTER_KEY);
  if (key === undefined) return undefined;
  const weapons = raisableWeapons(units, key);
  if (weapons === undefined) return undefined;
  const trophies = raisedWeaponTrophies(
    units,
    key,
    weapons.held,
    weapons.raised,
  );
  return {
    raised: weapons.raised,
    ledger: trophies.ledger,
    changed: weapons.raised.length > 0 || trophies.changed,
  };
}

/** True while `maxWeaponSeries` would change the save. */
export const canMaxWeaponSeries = (units: Units, character: UnitEntity) =>
  canUnlockWeaponSeries(units, character) ||
  (planWeaponSeries(units, character)?.changed ?? false);

export const canMaxAllWeaponSeries = (save: Save) =>
  save.slotData.units
    .entitiesWith(CHARACTER_KEY)
    .some((entity) => canMaxWeaponSeries(save.slotData.units, entity));
