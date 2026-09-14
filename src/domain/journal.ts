import {
  ARCHIVE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  TIP_KEYS,
} from "../data/journal";
import type { UnitStore } from "../format/unit-store";
import { keyOf } from "./keys";
import {
  ARCHIVE_OBTAINED,
  ARCHIVE_VIEWED,
  GLOSSARY_LISTED,
  GLOSSARY_PARAGRAPHS_2_TO_4,
  GLOSSARY_VIEWED,
  ID,
  MUSIC_LISTED,
  MUSIC_VIEWED,
  TIP_LISTED,
  TIP_VIEWED,
} from "./layout";

export interface ArchiveEntry {
  /** `story_note_archive.Key`. */
  key: string;
  obtained: boolean;
  /** Seen in the journal list; obtained entries without it show the new mark. */
  viewed: boolean;
}

/** Journal Archives in save order, every `story_note_archive` row obtained or not. */
export function readArchives(units: UnitStore): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  for (const unit of units.ofIdType(ID.ARCHIVE_KEY)) {
    const key = keyOf(ARCHIVE_KEYS, unit.values[0] as number);
    if (!key) continue;
    const flags = units.values(ID.ARCHIVE_FLAGS, unit.unitId, "uint")?.[0] ?? 0;
    entries.push({
      key,
      obtained: (flags & ARCHIVE_OBTAINED) !== 0,
      viewed: (flags & ARCHIVE_VIEWED) !== 0,
    });
  }
  return entries;
}

export interface GlossaryEntry {
  /** `story_note_wordlist.Key`, saved as the hash of WORDLIST_ and its last 4 digits. */
  key: string;
  /** Unlisted entries are left out of their tab in game. */
  listed: boolean;
  /** Seen in the list; listed entries without it show the new mark. */
  viewed: boolean;
  /** Paragraphs shown, 0 when unlisted. */
  paragraphs: number;
}

const bitCount = (n: number) => n.toString(2).replaceAll("0", "").length;

/** Journal Glossary in save order, every `story_note_wordlist` row listed or not. */
export function readGlossary(units: UnitStore): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  for (const unit of units.ofIdType(ID.GLOSSARY_KEY)) {
    const key = keyOf(GLOSSARY_KEYS, unit.values[0] as number);
    if (!key) continue;
    const flags =
      units.values(ID.GLOSSARY_FLAGS, unit.unitId, "uint")?.[0] ?? 0;
    const listed = (flags & GLOSSARY_LISTED) !== 0;
    entries.push({
      key,
      listed,
      viewed: (flags & GLOSSARY_VIEWED) !== 0,
      paragraphs: listed ? 1 + bitCount(flags & GLOSSARY_PARAGRAPHS_2_TO_4) : 0,
    });
  }
  return entries;
}

export interface TipEntry {
  /** `story_note_tips.TutorialWindowIdUnlockRequirement`, 8 hex digits when unnamed. */
  key: string;
  /**
   * Unlisted tips are left out of their tab. The table also hides some listed
   * ones: other platforms' versions and the tip with `QuestId` 1.
   */
  listed: boolean;
  /** Seen in the journal list; listed tips without it show the new mark. */
  viewed: boolean;
}

/** Journal Tips in save order, every `story_note_tips` row listed or not. */
export function readTips(units: UnitStore): TipEntry[] {
  const entries: TipEntry[] = [];
  for (const unit of units.ofIdType(ID.TIP_KEY)) {
    const key = keyOf(TIP_KEYS, unit.values[0] as number);
    if (!key) continue;
    const flags = units.values(ID.TIP_FLAGS, unit.unitId, "uint")?.[0] ?? 0;
    entries.push({
      key,
      listed: (flags & TIP_LISTED) !== 0,
      viewed: (flags & TIP_VIEWED) !== 0,
    });
  }
  return entries;
}

export interface MusicEntry {
  /** `story_note_bgm.Key`. */
  key: string;
  /** Unlisted tracks are left out of the collection. */
  listed: boolean;
  /** Seen in the journal list; listed tracks without it show the new mark. */
  viewed: boolean;
}

/** Journal Music Collection in save order, every `story_note_bgm` row listed or not. */
export function readMusic(units: UnitStore): MusicEntry[] {
  const entries: MusicEntry[] = [];
  for (const unit of units.ofIdType(ID.MUSIC_KEY)) {
    const key = keyOf(MUSIC_KEYS, unit.values[0] as number);
    if (!key) continue;
    const flags = units.values(ID.MUSIC_FLAGS, unit.unitId, "uint")?.[0] ?? 0;
    entries.push({
      key,
      listed: (flags & MUSIC_LISTED) !== 0,
      viewed: (flags & MUSIC_VIEWED) !== 0,
    });
  }
  return entries;
}
