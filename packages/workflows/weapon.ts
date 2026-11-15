import type { Save, UnitEntity, Units } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { WEAPON_ROWS, raisableWeapons, unlockableWeapons } from "@gbfr/weapon";
import { CHARACTER_KEY } from "@gbfr/character";
import { registerFieldNoteWeapon } from "@gbfr/journal/edit";
import {
  forgedWeaponTrophies,
  raisedWeaponTrophies,
  writeLedger,
} from "@gbfr/trophy/edit";
import { forgeWeapon, raiseWeapons } from "@gbfr/weapon/edit";

export const canUnlockWeaponSeries = (units: Units, character: UnitEntity) =>
  unlockableWeapons(units, character).length > 0;

/** Adds one weapon as a forge does, at no cost. */
export function unlockWeapon(draft: Draft, character: UnitEntity, key: string) {
  forgeWeapon(draft, character, key);
  registerFieldNoteWeapon(draft, key);
  const { character: owner, series } = WEAPON_ROWS[key]!;
  forgedWeaponTrophies(draft, owner, series);
}

export function unlockWeaponSeries(draft: Draft, character: UnitEntity) {
  for (const { key } of unlockableWeapons(draft, character))
    unlockWeapon(draft, character, key);
}

/** The writes `maxWeaponSeries` makes on a character's held weapons. */
function planWeaponSeries(units: Units, character: UnitEntity) {
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

/** Unlocks missing weapons, raises the series and earns the trophies met. */
export function maxWeaponSeries(draft: Draft, character: UnitEntity) {
  unlockWeaponSeries(draft, character);
  const plan = planWeaponSeries(draft, character);
  if (!plan?.changed)
    throw new Error(`character ${character} has no weapon series to raise`);
  raiseWeapons(draft, plan.raised);
  writeLedger(draft, plan.ledger);
}

const characters = (units: Units) => units.entitiesWith(CHARACTER_KEY);

export const canUnlockAllWeaponSeries = (save: Save) =>
  characters(save.slotData.units).some((entity) =>
    canUnlockWeaponSeries(save.slotData.units, entity),
  );

/** `unlockWeaponSeries` on every character. */
export function unlockAllWeaponSeries(draft: Draft) {
  for (const entity of characters(draft)) unlockWeaponSeries(draft, entity);
}

export const canMaxAllWeaponSeries = (save: Save) =>
  characters(save.slotData.units).some((entity) =>
    canMaxWeaponSeries(save.slotData.units, entity),
  );

/** `maxWeaponSeries` on every character it would change. */
export function maxAllWeaponSeries(draft: Draft) {
  for (const entity of characters(draft))
    if (canMaxWeaponSeries(draft, entity)) maxWeaponSeries(draft, entity);
}
