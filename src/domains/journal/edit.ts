import type { UnitStore } from "../../core/unit-store";
import type { Patch } from "../../core/session";
import { hashId } from "../../core/xxhash32-custom";
import { hashOfKey } from "../../core/keys";
import { WEAPONS } from "../../tables/weapons";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
  TIP_FLAGS,
  TIP_KEY,
} from "./attributes";

/** Unlocks one archive entry. */
export const unlockArchive = (units: UnitStore, archive: string): Patch =>
  units
    .of(units.onlyEntityWhere(ARCHIVE_KEY, hashId(archive)))
    .patch(ARCHIVE_FLAGS, { unlocked: true });

/** Unlocks the weapon's field note, none when it has no entry. */
export function registerFieldNoteWeapon(
  units: UnitStore,
  key: string,
): Patch[] {
  const note = units.entitiesWhere(
    FIELD_NOTE_WEAPON_KEY,
    hashOfKey(WEAPONS, key),
  )[0];
  return note === undefined
    ? []
    : [units.of(note).patch(FIELD_NOTE_WEAPON_FLAGS, { unlocked: true })];
}

/** Unlocks the listed tips, leaving out those already unlocked. */
export const unlockTips = (
  units: UnitStore,
  hashes: readonly number[],
): Patch[] => units.patchWhere(TIP_KEY, hashes, TIP_FLAGS, { unlocked: true });
