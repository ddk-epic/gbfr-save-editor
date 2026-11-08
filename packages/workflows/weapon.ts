import type { UnitEntity, UnitStore } from "@gbfr/core";
import type { SaveSession } from "@gbfr/core/session";
import { WEAPON_ROWS, raisableWeapons, unlockableWeapons } from "@gbfr/weapon";
import { CHARACTER_KEY } from "@gbfr/character";
import { registerFieldNoteWeapon } from "@gbfr/journal/edit";
import { forgedWeaponTrophies, raisedWeaponTrophies } from "@gbfr/trophy/edit";
import { forgeWeapon, raiseWeapons } from "@gbfr/weapon/edit";

export const canUnlockWeaponSeries = (
  units: UnitStore,
  character: UnitEntity,
) => unlockableWeapons(units, character).length > 0;

/** Adds one weapon as a forge does, at no cost. */
export function unlockWeapon(
  session: SaveSession,
  character: UnitEntity,
  key: string,
) {
  const units = session.save.slotData.units;
  session.patch([
    ...forgeWeapon(units, character, key),
    ...registerFieldNoteWeapon(units, key),
  ]);
  const { character: owner, series } = WEAPON_ROWS[key]!;
  session.patch(forgedWeaponTrophies(units, owner, series));
}

export function unlockWeaponSeries(
  session: SaveSession,
  character: UnitEntity,
) {
  const units = session.save.slotData.units;
  for (const { key } of unlockableWeapons(units, character))
    unlockWeapon(session, character, key);
}

/** The writes `maxWeaponSeries` makes on a character's held weapons. */
function planWeaponSeries(units: UnitStore, character: UnitEntity) {
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
    patches: trophies.patches,
    changed: weapons.raised.length > 0 || trophies.changed,
  };
}

/** True while `maxWeaponSeries` would change the save. */
export const canMaxWeaponSeries = (units: UnitStore, character: UnitEntity) =>
  canUnlockWeaponSeries(units, character) ||
  (planWeaponSeries(units, character)?.changed ?? false);

/** Unlocks missing weapons, raises the series and earns the trophies met. */
export function maxWeaponSeries(session: SaveSession, character: UnitEntity) {
  unlockWeaponSeries(session, character);
  const units = session.save.slotData.units;
  const plan = planWeaponSeries(units, character);
  if (!plan?.changed)
    throw new Error(`character ${character} has no weapon series to raise`);
  session.patch([...raiseWeapons(units, plan.raised), ...plan.patches]);
}
