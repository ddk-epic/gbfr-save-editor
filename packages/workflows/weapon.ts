import type { UnitEntity, Units } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { WEAPON_ROWS, unlockableWeapons } from "@gbfr/weapon";
import { CHARACTER_KEY } from "@gbfr/character";
import { registerFieldNoteWeapon } from "@gbfr/journal/edit";
import { canMaxWeaponSeries, planWeaponSeries } from "@gbfr/save";
import { forgedWeaponTrophies, writeLedger } from "@gbfr/trophy/edit";
import { forgeWeapon, raiseWeapons } from "@gbfr/weapon/edit";

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

/** `unlockWeaponSeries` on every character. */
export function unlockAllWeaponSeries(draft: Draft) {
  for (const entity of characters(draft)) unlockWeaponSeries(draft, entity);
}

/** `maxWeaponSeries` on every character it would change. */
export function maxAllWeaponSeries(draft: Draft) {
  for (const entity of characters(draft))
    if (canMaxWeaponSeries(draft, entity)) maxWeaponSeries(draft, entity);
}
