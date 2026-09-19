import {
  FIELD_NOTE_TREASURE,
  FIELD_NOTE_WEAPONS,
  STORY_ORDER,
} from "../data/journal";
import type { Attribute } from "../core/attribute";
import type { UnitStore } from "../core/unit-store";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_CHARACTER_FLAGS,
  FIELD_NOTE_CHARACTER_KEY,
  FIELD_NOTE_FOE_FLAGS,
  FIELD_NOTE_FOE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
  FIELD_NOTE_WRIGHTSTONE_FLAGS,
  FIELD_NOTE_WRIGHTSTONE_KEY,
  GLOSSARY_FLAGS,
  GLOSSARY_KEY,
  ITEM_FLAGS,
  ITEM_KEY,
  MUSIC_FLAGS,
  MUSIC_KEY,
  STORY_FLAGS,
  STORY_KEY,
  TIP_FLAGS,
  TIP_KEY,
} from "./layout";

/** One row of a journal list: `unlocked` is the entry having a page, `viewed`
 * its new mark being cleared. The bits are in research/save-units.md. */
export interface JournalEntry {
  key: string;
  unlocked: boolean;
  viewed: boolean;
}

type JournalFlags = { unlocked: boolean; viewed: boolean };

/** A list keyed by a hash unit with a flags unit beside it. */
function section(
  units: UnitStore,
  key: Attribute<string | undefined>,
  flags: Attribute<JournalFlags>,
): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const entity of units.entitiesWith(key)) {
    const at = units.of(entity);
    const name = at.get(key);
    if (!name) continue;
    entries.push({ key: name, ...at.get(flags) });
  }
  return entries;
}

/** Archives, every `story_note_archive` row. */
export const readArchives = (units: UnitStore) =>
  section(units, ARCHIVE_KEY, ARCHIVE_FLAGS);

/** Glossary, every `story_note_wordlist` row, hashed as WORDLIST_ and its last 4 digits. */
export const readGlossary = (units: UnitStore) =>
  section(units, GLOSSARY_KEY, GLOSSARY_FLAGS);

/** Tips, every `story_note_tips` row. The table hides some that are unlocked:
 * other platforms' versions and `QuestId` 1. */
export const readTips = (units: UnitStore) =>
  section(units, TIP_KEY, TIP_FLAGS);

/** Music Collection, every `story_note_bgm` row. */
export const readMusic = (units: UnitStore) =>
  section(units, MUSIC_KEY, MUSIC_FLAGS);

export interface StoryEntry extends JournalEntry {
  /** `story_note_chapter.Key`, 0 for The Story So Far, 1-14 for the chapters. */
  chapter: number;
}

/** Main Story in `STORY_ORDER`, the order the game lists, not save order. */
export function readMainStory(units: UnitStore): StoryEntry[] {
  const held = new Map(
    section(units, STORY_KEY, STORY_FLAGS).map((e) => [e.key, e]),
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
function flagsByKey<F>(
  units: UnitStore,
  key: Attribute<string | undefined>,
  flags: Attribute<F>,
): Map<string, F> {
  const held = new Map<string, F>();
  for (const entity of units.entitiesWith(key)) {
    const at = units.of(entity);
    const name = at.get(key);
    if (name) held.set(name, at.get(flags));
  }
  return held;
}

/** Field Notes, all five categories. Weapons rides on the weapon list and
 * Treasure on the item inventory, so both are cut to the rows they draw from. */
export function readFieldNotes(units: UnitStore): FieldNoteEntry[] {
  const own = (
    category: FieldNoteCategory,
    key: Attribute<string | undefined>,
    flags: Attribute<JournalFlags>,
  ): FieldNoteEntry[] =>
    [...flagsByKey(units, key, flags)].map(([name, { unlocked }]) => ({
      category,
      key: name,
      unlocked,
      viewed: undefined,
    }));

  const weapons = flagsByKey(
    units,
    FIELD_NOTE_WEAPON_KEY,
    FIELD_NOTE_WEAPON_FLAGS,
  );
  const treasure = flagsByKey(units, ITEM_KEY, ITEM_FLAGS);

  return [
    ...own("characters", FIELD_NOTE_CHARACTER_KEY, FIELD_NOTE_CHARACTER_FLAGS),
    ...own("foes", FIELD_NOTE_FOE_KEY, FIELD_NOTE_FOE_FLAGS),
    ...FIELD_NOTE_WEAPONS.map((key) => ({
      category: "weapons" as const,
      key,
      unlocked: weapons.get(key)?.unlocked ?? false,
      viewed: undefined,
    })),
    ...FIELD_NOTE_TREASURE.map((key) => {
      const flags = treasure.get(key);
      return {
        category: "treasure" as const,
        key,
        unlocked: flags?.fieldNote ?? false,
        viewed: flags?.seen ?? false,
      };
    }),
    ...own(
      "wrightstones",
      FIELD_NOTE_WRIGHTSTONE_KEY,
      FIELD_NOTE_WRIGHTSTONE_FLAGS,
    ),
  ];
}
