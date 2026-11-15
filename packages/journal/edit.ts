import { hashId, hashOfKey } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { WEAPONS } from "@gbfr/tables";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
  TIP_FLAGS,
  TIP_KEY,
} from "./attributes";

/** Unlocks one archive entry. */
export const unlockArchive = (draft: Draft, archive: string) =>
  draft
    .of(draft.onlyEntityWhere(ARCHIVE_KEY, hashId(archive)))
    .set(ARCHIVE_FLAGS, { unlocked: true });

/** Unlocks the weapon's field note, none when it has no entry. */
export function registerFieldNoteWeapon(draft: Draft, key: string) {
  const note = draft.entitiesWhere(
    FIELD_NOTE_WEAPON_KEY,
    hashOfKey(WEAPONS, key),
  )[0];
  if (note !== undefined)
    draft.of(note).set(FIELD_NOTE_WEAPON_FLAGS, { unlocked: true });
}

export const unlockTips = (draft: Draft, hashes: readonly number[]) =>
  draft.setWhere(TIP_KEY, hashes, TIP_FLAGS, { unlocked: true });
