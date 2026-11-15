import { hashId } from "../../packages/core/xxhash32-custom";
import { UNNAMED_KEY, type Context, type DataFile } from "./context";

/** Export name -> output file, table and key column. */
const SOURCES = {
  CHARACTER_KEYS: ["tables", "chara", "CharId"],
  WEAPON_KEYS: ["tables", "weapon", "Key"],
  GEM_KEYS: ["tables", "gem", "Key"],
  SKILL_KEYS: ["tables", "skill", "Key"],
  ABILITY_KEYS: ["skill", "ability", "Key"],
  ITEM_KEYS: ["tables", "item", "Key"],
  LIMIT_BONUS_PARAM_KEYS: ["over-mastery", "limit_bonus_param", "Key"],
  SKILLBOARD_EFFECT_KEYS: ["master-trait", "skillboard_effect", "Key"],
  SUMMON_KEYS: ["summon", "summon", "Key"],
  SUMMON_BASE_PARAM_KEYS: ["summon", "summon_base_param", "Key"],
  FATE_EPISODE_KEYS: ["fate-episode", "fate_episode", "Key"],
  ARCHIVE_KEYS: ["journal", "story_note_archive", "Key"],
  STORY_KEYS: ["journal", "story", "Key"],
  FIELD_NOTE_CHARACTER_KEYS: ["journal", "story_note_picturebook_chara", "Key"],
  FIELD_NOTE_FOE_KEYS: ["journal", "story_note_picturebook_enemy", "EnemyId"],
  FIELD_NOTE_WRIGHTSTONE_KEYS: [
    "journal",
    "story_note_picturebook_code",
    "Key",
  ],
  GLOSSARY_KEYS: ["journal", "story_note_wordlist", "Key"],
  TIP_KEYS: ["journal", "story_note_tips", "TutorialWindowIdUnlockRequirement"],
  MUSIC_KEYS: ["journal", "story_note_bgm", "Key"],
} as const satisfies Record<string, readonly [DataFile, string, string]>;

/** Sources the save hashes under another name than the key. */
const HASHED_AS: Partial<
  Record<keyof typeof SOURCES, (key: string) => string>
> = {
  // TXT_GLOSSARY_TTL_0075 is saved as WORDLIST_0075.
  GLOSSARY_KEYS: (key) => `WORDLIST_${key.slice(-4)}`,
};

export function genKeys({ db, emit }: Context) {
  for (const [exportName, [file, table, column]] of Object.entries(SOURCES)) {
    const keys = (
      db.prepare(`select distinct "${column}" as k from "${table}"`).all() as {
        k: unknown;
      }[]
    )
      .map((row) => row.k)
      .filter((k): k is string => typeof k === "string" && k !== "")
      .sort();

    const byHash = new Map<number, string>();
    const hashedAs = HASHED_AS[exportName as keyof typeof SOURCES];
    for (const key of keys) {
      // The extractor writes a key it cannot name as its hash in 8 hex digits.
      const hash = UNNAMED_KEY.test(key)
        ? parseInt(key, 16)
        : hashId(hashedAs ? hashedAs(key) : key);
      const clash = byHash.get(hash);
      if (clash)
        throw new Error(
          `${table}.${column}: ${clash} and ${key} share hash ${hash}`,
        );
      byHash.set(hash, key);
    }

    const body = [...byHash]
      .sort(([a], [b]) => a - b)
      .map(
        ([hash, key]) =>
          `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify(key)},`,
      )
      .join("\n");
    emit(
      file,
      `/** ${table}.${column}, ${byHash.size} keys. */\nexport const ${exportName}: Readonly<Record<number, string>> = {\n${body}\n};`,
    );
    const unnamed = keys.filter((key) => UNNAMED_KEY.test(key)).length;
    console.log(
      `${exportName}: ${byHash.size} keys from ${table}.${column}, ${unnamed} unnamed`,
    );
  }
}
