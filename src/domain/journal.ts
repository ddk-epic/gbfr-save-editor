import {
  ARCHIVE_KEYS,
  FIELD_NOTE_CHARACTER_KEYS,
  FIELD_NOTE_FOE_KEYS,
  FIELD_NOTE_TREASURE,
  FIELD_NOTE_WEAPONS,
  FIELD_NOTE_WRIGHTSTONE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  STORY_ORDER,
  TIP_KEYS,
} from "../data/journal";
import { ITEM_KEYS } from "../data/items";
import { WEAPON_KEYS } from "../data/weapons";
import type { UnitStore } from "../format/unit-store";
import { keyOf } from "./keys";
import {
  FIELD_NOTE_WEAPON_UNLOCKED,
  ID,
  ITEM_FIELD_NOTE,
  ITEM_SEEN,
  JOURNAL_UNLOCKED,
  JOURNAL_VIEWED,
} from "./layout";

/** One row of a journal list: `unlocked` is the entry having a page, `viewed`
 * its new mark being cleared. The bits are in research/save-units.md. */
export interface JournalEntry {
  key: string;
  unlocked: boolean;
  viewed: boolean;
}

/** A list keyed by a hash unit with a flags unit beside it. */
function section(
  units: UnitStore,
  keys: Readonly<Record<number, string>>,
  keyId: number,
  flagsId: number,
): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const unit of units.withAttribute(keyId)) {
    const key = keyOf(keys, unit.values[0] as number);
    if (!key) continue;
    const flags = units.values(flagsId, unit.entity, "uint")?.[0] ?? 0;
    entries.push({
      key,
      unlocked: (flags & JOURNAL_UNLOCKED) !== 0,
      viewed: (flags & JOURNAL_VIEWED) !== 0,
    });
  }
  return entries;
}

/** Archives, every `story_note_archive` row. */
export const readArchives = (units: UnitStore) =>
  section(units, ARCHIVE_KEYS, ID.ARCHIVE_KEY, ID.ARCHIVE_FLAGS);

/** Glossary, every `story_note_wordlist` row, hashed as WORDLIST_ and its last 4 digits. */
export const readGlossary = (units: UnitStore) =>
  section(units, GLOSSARY_KEYS, ID.GLOSSARY_KEY, ID.GLOSSARY_FLAGS);

/** Tips, every `story_note_tips` row. The table hides some that are unlocked:
 * other platforms' versions and `QuestId` 1. */
export const readTips = (units: UnitStore) =>
  section(units, TIP_KEYS, ID.TIP_KEY, ID.TIP_FLAGS);

/** Music Collection, every `story_note_bgm` row. */
export const readMusic = (units: UnitStore) =>
  section(units, MUSIC_KEYS, ID.MUSIC_KEY, ID.MUSIC_FLAGS);

export interface StoryEntry extends JournalEntry {
  /** `story_note_chapter.Key`, 0 for The Story So Far, 1-14 for the chapters. */
  chapter: number;
}

/** Main Story in `STORY_ORDER`, the order the game lists, not save order. */
export function readMainStory(units: UnitStore): StoryEntry[] {
  const held = new Map(
    section(units, STORY_KEYS, ID.STORY_KEY, ID.STORY_FLAGS).map((e) => [
      e.key,
      e,
    ]),
  );
  const entries: StoryEntry[] = [];
  for (const [key, chapter] of STORY_ORDER) {
    const entry = held.get(key);
    if (!entry) continue;
    entries.push({ ...entry, chapter });
    held.delete(key);
  }
  // A row the save holds and STORY_ORDER does not, after a game update.
  for (const entry of held.values()) entries.push({ ...entry, chapter: 0 });
  return entries;
}

export type FieldNoteCategory =
  "characters" | "foes" | "weapons" | "treasure" | "wrightstones";

export interface FieldNoteEntry extends Omit<JournalEntry, "viewed"> {
  category: FieldNoteCategory;
  /** Only Treasure has a bit for it; the rest are undecoded. */
  viewed: boolean | undefined;
}

/** key -> flags, for the categories that ride on a list kept for something else. */
function flagsByKey(
  units: UnitStore,
  keys: Readonly<Record<number, string>>,
  keyId: number,
  flagsId: number,
): Map<string, number> {
  const held = new Map<string, number>();
  for (const unit of units.withAttribute(keyId)) {
    const key = keyOf(keys, unit.values[0] as number);
    if (key)
      held.set(key, units.values(flagsId, unit.entity, "uint")?.[0] ?? 0);
  }
  return held;
}

/** Field Notes, all five categories. Weapons rides on the weapon list and
 * Treasure on the item inventory, so both are cut to the rows they draw from. */
export function readFieldNotes(units: UnitStore): FieldNoteEntry[] {
  const own = (
    category: FieldNoteCategory,
    keys: Readonly<Record<number, string>>,
    keyId: number,
    flagsId: number,
  ): FieldNoteEntry[] =>
    [...flagsByKey(units, keys, keyId, flagsId)].map(([key, flags]) => ({
      category,
      key,
      unlocked: (flags & JOURNAL_UNLOCKED) !== 0,
      viewed: undefined,
    }));

  const weapons = flagsByKey(
    units,
    WEAPON_KEYS,
    ID.FIELD_NOTE_WEAPON_KEY,
    ID.FIELD_NOTE_WEAPON_FLAGS,
  );
  const treasure = flagsByKey(units, ITEM_KEYS, ID.ITEM_KEY, ID.ITEM_FLAGS);

  return [
    ...own(
      "characters",
      FIELD_NOTE_CHARACTER_KEYS,
      ID.FIELD_NOTE_CHARACTER_KEY,
      ID.FIELD_NOTE_CHARACTER_FLAGS,
    ),
    ...own(
      "foes",
      FIELD_NOTE_FOE_KEYS,
      ID.FIELD_NOTE_FOE_KEY,
      ID.FIELD_NOTE_FOE_FLAGS,
    ),
    ...FIELD_NOTE_WEAPONS.map((key) => ({
      category: "weapons" as const,
      key,
      unlocked: ((weapons.get(key) ?? 0) & FIELD_NOTE_WEAPON_UNLOCKED) !== 0,
      viewed: undefined,
    })),
    ...FIELD_NOTE_TREASURE.map((key) => {
      const flags = treasure.get(key) ?? 0;
      return {
        category: "treasure" as const,
        key,
        unlocked: (flags & ITEM_FIELD_NOTE) !== 0,
        viewed: (flags & ITEM_SEEN) !== 0,
      };
    }),
    ...own(
      "wrightstones",
      FIELD_NOTE_WRIGHTSTONE_KEYS,
      ID.FIELD_NOTE_WRIGHTSTONE_KEY,
      ID.FIELD_NOTE_WRIGHTSTONE_FLAGS,
    ),
  ];
}
