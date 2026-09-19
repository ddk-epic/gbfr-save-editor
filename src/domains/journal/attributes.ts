import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import {
  ARCHIVE_KEYS,
  FIELD_NOTE_CHARACTER_KEYS,
  FIELD_NOTE_FOE_KEYS,
  FIELD_NOTE_WRIGHTSTONE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "../../data/journal";
import { WEAPONS } from "../weapon/attributes";

const journalFlags = (id: number) =>
  Attribute.flags(id, { unlocked: 1, seen: 2 });

export const ARCHIVE_KEY = keyAttribute(
  7901,
  keyTable("story_note_archive", ARCHIVE_KEYS),
);
export const ARCHIVE_FLAGS = journalFlags(7902);

export const GLOSSARY_KEY = keyAttribute(
  8101,
  keyTable("story_note_wordlist", GLOSSARY_KEYS),
);
export const GLOSSARY_FLAGS = journalFlags(8102);

export const STORY_KEY = keyAttribute(8201, keyTable("story", STORY_KEYS));
export const STORY_FLAGS = journalFlags(8202);

export const MUSIC_KEY = keyAttribute(
  8301,
  keyTable("story_note_bgm", MUSIC_KEYS),
);
export const MUSIC_FLAGS = journalFlags(8302);

export const TIP_KEY = keyAttribute(
  8701,
  keyTable("story_note_tips", TIP_KEYS),
);
export const TIP_FLAGS = journalFlags(8702);

export const FIELD_NOTE_CHARACTER_KEY = keyAttribute(
  8401,
  keyTable("story_note_picturebook_chara", FIELD_NOTE_CHARACTER_KEYS),
);
export const FIELD_NOTE_CHARACTER_FLAGS = journalFlags(8402);

export const FIELD_NOTE_FOE_KEY = keyAttribute(
  8501,
  keyTable("story_note_picturebook_enemy", FIELD_NOTE_FOE_KEYS),
);
export const FIELD_NOTE_FOE_FLAGS = journalFlags(8502);

export const FIELD_NOTE_WRIGHTSTONE_KEY = keyAttribute(
  8601,
  keyTable("story_note_picturebook_code", FIELD_NOTE_WRIGHTSTONE_KEYS),
);
export const FIELD_NOTE_WRIGHTSTONE_FLAGS = journalFlags(8602);

// Weapons and Treasure have no story_note_picturebook table of their own. They
// are filtered subsets of weapon and item, so they resolve through those.
export const FIELD_NOTE_WEAPON_KEY = keyAttribute(7401, WEAPONS);
export const FIELD_NOTE_WEAPON_FLAGS = Attribute.flags(7403, { unlocked: 4 });
