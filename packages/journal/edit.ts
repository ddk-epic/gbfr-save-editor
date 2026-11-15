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

type ArchiveFlags = Parameters<typeof ARCHIVE_FLAGS.write>[0];

/** Unlocks one archive entry with `flags`, and returns whether it was locked. */
export function unlockArchive(
  draft: Draft,
  archive: string,
  flags: ArchiveFlags = { unlocked: true },
) {
  const entry = draft.of(draft.onlyEntityWhere(ARCHIVE_KEY, hashId(archive)));
  if (entry.get(ARCHIVE_FLAGS).unlocked) return false;
  entry.set(ARCHIVE_FLAGS, flags);
  return true;
}

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
