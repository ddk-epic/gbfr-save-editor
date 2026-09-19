import { CHARACTER_KEYS, FATE_EPISODE_KEYS } from "../data/characters";
import { ITEM_KEYS } from "../data/items";
import {
  ARCHIVE_KEYS,
  FIELD_NOTE_CHARACTER_KEYS,
  FIELD_NOTE_FOE_KEYS,
  FIELD_NOTE_WRIGHTSTONE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "../data/journal";
import { SKILLBOARD_EFFECT_KEYS } from "../data/master-traits";
import { LIMIT_BONUS_PARAM_KEYS } from "../data/masteries";
import { GEM_KEYS, SKILL_KEYS } from "../data/sigils";
import { ABILITY_KEYS } from "../data/skills";
import { SUMMON_BASE_PARAM_KEYS, SUMMON_KEYS } from "../data/summons";
import { WEAPON_KEYS } from "../data/weapons";
import type { Attribute } from "../core/attribute";
import type { UnitAttribute } from "../core/save-data-binary";
import { hashId } from "../core/xxhash32-custom";

/** The save's value for an empty id. */
export const EMPTY_HASH = hashId("");

const TABLE_NAMES = new Map<Readonly<Record<number, string>>, string>([
  [CHARACTER_KEYS, "chara"],
  [WEAPON_KEYS, "weapon"],
  [GEM_KEYS, "gem"],
  [SKILL_KEYS, "skill"],
  [ABILITY_KEYS, "ability"],
  [ITEM_KEYS, "item"],
  [LIMIT_BONUS_PARAM_KEYS, "limit_bonus_param"],
  [SKILLBOARD_EFFECT_KEYS, "skillboard_effect"],
  [SUMMON_KEYS, "summon"],
  [SUMMON_BASE_PARAM_KEYS, "summon_base_param"],
  [FATE_EPISODE_KEYS, "fate_episode"],
  [ARCHIVE_KEYS, "story_note_archive"],
  [STORY_KEYS, "story"],
  [FIELD_NOTE_CHARACTER_KEYS, "story_note_picturebook_chara"],
  [FIELD_NOTE_FOE_KEYS, "story_note_picturebook_enemy"],
  [FIELD_NOTE_WRIGHTSTONE_KEYS, "story_note_picturebook_code"],
  // The Weapons and Treasure categories have no story_note_picturebook table.
  // They are filtered subsets of `weapon` and `item`, so they resolve through
  // WEAPON_KEYS and ITEM_KEYS.
  [GLOSSARY_KEYS, "story_note_wordlist"],
  [TIP_KEYS, "story_note_tips"],
  [MUSIC_KEYS, "story_note_bgm"],
]);

const warned = new Set<string>();

export function hashAttribute(
  id: UnitAttribute,
): Attribute<number | undefined> {
  return {
    id,
    valueType: "uint",
    read(values) {
      const hash = values?.[0] as number | undefined;
      return hash === undefined || hash === EMPTY_HASH ? undefined : hash;
    },
  };
}

export function keyAttribute(
  id: UnitAttribute,
  table: Readonly<Record<number, string>>,
): Attribute<string | undefined> {
  return {
    id,
    valueType: "uint",
    read: (values) => keyOf(table, values?.[0] as number | undefined),
  };
}

/** Archive key for a hash, "#" + 8 hex digits when the table has none, undefined when empty. */
export function keyOf(
  table: Readonly<Record<number, string>>,
  hash: number | undefined,
): string | undefined {
  if (hash === undefined || hash === EMPTY_HASH) return undefined;
  const key = table[hash];
  if (key !== undefined) return key;

  const unresolved = `#${hash.toString(16).padStart(8, "0")}`;
  const tableName = TABLE_NAMES.get(table) ?? "unknown";
  // Once per hash, so a missing key surfaces without flooding the console.
  if (!warned.has(`${tableName}${unresolved}`)) {
    warned.add(`${tableName}${unresolved}`);
    console.warn(
      `gbfr-save-editor: hash ${unresolved} not in the ${tableName} table, run pnpm gen:data or check the extract`,
    );
  }
  return unresolved;
}
