// Generates the src/data/ tables (hash -> key per archive table, masteries, master traits)
// and src/data/text/ (key -> game text per language).
// pnpm gen:data [tables.sqlite] [text dir]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { hashId } from "../src/hash/xxhash32-custom";

const [
  dbPath = "../gbfr-extract/tables.sqlite",
  textDir = "../gbfr-extract/system/table/text",
] = process.argv.slice(2);

type DataFile =
  | "characters"
  | "master-traits"
  | "masteries"
  | "weapons"
  | "sigils"
  | "skills"
  | "items"
  | "summons"
  | "journal";

/** Export name -> output file, table and key column. */
const SOURCES = {
  CHARACTER_KEYS: ["characters", "chara", "CharId"],
  WEAPON_KEYS: ["weapons", "weapon", "Key"],
  GEM_KEYS: ["sigils", "gem", "Key"],
  SKILL_KEYS: ["sigils", "skill", "Key"],
  ABILITY_KEYS: ["skills", "ability", "Key"],
  ITEM_KEYS: ["items", "item", "Key"],
  LIMIT_BONUS_PARAM_KEYS: ["masteries", "limit_bonus_param", "Key"],
  SKILLBOARD_EFFECT_KEYS: ["master-traits", "skillboard_effect", "Key"],
  SUMMON_KEYS: ["summons", "summon", "Key"],
  SUMMON_BASE_PARAM_KEYS: ["summons", "summon_base_param", "Key"],
  FATE_EPISODE_KEYS: ["characters", "fate_episode", "Key"],
  ARCHIVE_KEYS: ["journal", "story_note_archive", "Key"],
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

const UNNAMED_KEY = /^[0-9A-F]{8}$/;

const db = new DatabaseSync(dbPath, { readOnly: true });
const blocks = new Map<DataFile, string[]>();
const emit = (file: DataFile, block: string) => {
  const list = blocks.get(file) ?? [];
  blocks.set(file, list);
  list.push(block);
};

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

// Master trait cell by skillboard_effect key: "<category> <rank>", plus " perk"
// on the style perk. Ranks by skillboard_group key, in unlock order.
const RANKS: Record<string, string> = {
  "68DE92AC": "r1",
  A96D9EBC: "r2",
  "4A5DDC7B": "r3",
  "3B99904D": "ex",
};
const cells = (
  db
    .prepare(
      "select SkillboardEffectOrUiId as effect, SkillboardCategoryId as category, SkillboardGroupId as grp, Unk25 as weight from skillboard_layout",
    )
    .all() as {
    effect: string;
    category: string;
    grp: string;
    weight: number;
  }[]
).map(({ effect, category, grp, weight }) => {
  const rank = RANKS[grp];
  if (!rank) throw new Error(`skillboard_layout: unknown group ${grp}`);
  // Unk25 is 100 on the three perk cells of a style and 50 elsewhere.
  const hash = UNNAMED_KEY.test(effect) ? parseInt(effect, 16) : hashId(effect);
  return `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify(`${category} ${rank}${weight === 100 ? " perk" : ""}`)},`;
});
emit(
  "master-traits",
  `/** skillboard_layout by skillboard_effect key, ${cells.length} cells. */
export const SKILLBOARD_CELLS: Readonly<Record<number, string>> = {
${cells.sort().join("\n")}
};`,
);
console.log(`SKILLBOARD_CELLS: ${cells.length} cells`);

// Fate episode owner by fate_episode key, for the episodes the menu lists.
// REMI_* rows have no FateMissionTitle and never show.
const episodes = (
  db
    .prepare(
      "select Key, CharaId from fate_episode where FateMissionTitle <> ''",
    )
    .all() as {
    Key: string;
    CharaId: string;
  }[]
).map(
  ({ Key, CharaId }) =>
    `  0x${(UNNAMED_KEY.test(Key) ? parseInt(Key, 16) : hashId(Key)).toString(16).padStart(8, "0")}: ${JSON.stringify(CharaId)},`,
);
emit(
  "characters",
  `/** fate_episode.CharaId by fate_episode key, ${episodes.length} titled episodes. */
export const FATE_EPISODE_CHARACTERS: Readonly<Record<number, string>> = {
${episodes.sort().join("\n")}
};`,
);

// Menu order: playable 0-102, NPCs 500+, empty slots 1000+, dev rows 2000+.
const uiOrder = (
  db.prepare("select CharId, UIOrder from chara").all() as {
    CharId: string;
    UIOrder: number;
  }[]
).map(({ CharId, UIOrder }) => `  ${CharId}: ${UIOrder},`);
emit(
  "characters",
  `/** chara.UIOrder by chara.CharId. */
export const CHARACTER_UI_ORDER: Readonly<Record<string, number>> = {
${uiOrder.sort().join("\n")}
};`,
);

// Row n is the MSP a character has spent on master levels at master level n.
const masterMsp = (
  db.prepare("select TotalMSP from chara_master_exp").all() as {
    TotalMSP: number;
  }[]
).map((row) => row.TotalMSP);
emit(
  "characters",
  `/** chara_master_exp.TotalMSP, index = master level. */
export const MASTER_LEVEL_MSP: readonly number[] = [${masterMsp.join(", ")}];`,
);
console.log(`MASTER_LEVEL_MSP: ${masterMsp.length} levels`);

// Masteries nodes: per character and limit_bonus key, a [section, MspCost]
// pair per LimitBonusParamIndex, the bit 1602 sets when the node is taken.
const SECTIONS = [
  "offense",
  "offenseExtension",
  "defense",
  "defenseExtension",
  "collection",
  "transcendence",
] as const;
/** T1-6 transcendence rows, which the T7 rows replace. */
const REPLACED_TRANSCENDENCE = SECTIONS.length;
const nodes = new Map<string, Map<number, [number, number][]>>();
let nodeCount = 0;
let gaps = 0;
for (const tree of [
  "ap_tree_atk",
  "ap_tree_def",
  "ap_tree_wep",
  "ap_tree_rebuild",
]) {
  const rows = db
    .prepare(
      `select CharaId, LimitBonusId, LimitBonusParamIndex, MspCost, DiffSeparatorMaybe, ReqWepTranscensionLevel from "${tree}"`,
    )
    .all() as {
    CharaId: string;
    LimitBonusId: string;
    LimitBonusParamIndex: number;
    MspCost: number;
    DiffSeparatorMaybe: number;
    ReqWepTranscensionLevel: number;
  }[];
  for (const row of rows) {
    // The 100-150% extension sits at DiffSeparatorMaybe 311 and up.
    const extension = row.DiffSeparatorMaybe >= 300 ? 1 : 0;
    const section =
      tree === "ap_tree_atk"
        ? 0 + extension
        : tree === "ap_tree_def"
          ? 2 + extension
          : tree === "ap_tree_wep"
            ? 4
            : row.ReqWepTranscensionLevel === 7
              ? 5
              : REPLACED_TRANSCENDENCE;
    const hash = UNNAMED_KEY.test(row.LimitBonusId)
      ? parseInt(row.LimitBonusId, 16)
      : hashId(row.LimitBonusId);
    let byBonus = nodes.get(row.CharaId);
    if (!byBonus) nodes.set(row.CharaId, (byBonus = new Map()));
    const ladder = byBonus.get(hash) ?? [];
    byBonus.set(hash, ladder);
    if (ladder[row.LimitBonusParamIndex])
      throw new Error(
        `${tree}: ${row.CharaId} ${row.LimitBonusId} index ${row.LimitBonusParamIndex} twice`,
      );
    ladder[row.LimitBonusParamIndex] = [section, row.MspCost];
    nodeCount++;
  }
}
const characterBlocks = [...nodes]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([chara, byBonus]) => {
    const entries = [...byBonus]
      .sort(([a], [b]) => a - b)
      .map(([hash, ladder]) => {
        // 1602 keeps one byte of node bits.
        if (ladder.length > 8)
          throw new Error(`${chara} #${hash.toString(16)}: index past 7`);
        const cells = Array.from(ladder, (node) =>
          node ? `[${node[0]}, ${node[1]}]` : "null",
        );
        gaps += cells.filter((cell) => cell === "null").length;
        return `    0x${hash.toString(16).padStart(8, "0")}: [${cells.join(", ")}],`;
      });
    return [`  ${chara}: {`, ...entries, "  },"].join("\n");
  });
emit(
  "masteries",
  `export const MASTERY_SECTIONS = ${JSON.stringify(SECTIONS)} as const;

/** Section index of T1-6 transcendence rows, replaced by the T7 rows. */
export const REPLACED_TRANSCENDENCE = ${REPLACED_TRANSCENDENCE};

/**
 * ap_tree_* nodes, ${nodeCount} rows: chara.CharId -> limit_bonus key hash ->
 * [section index, MspCost] per LimitBonusParamIndex, null for an unused index.
 */
export const MASTERY_NODES: Readonly<
  Record<
    string,
    Readonly<Record<number, readonly (readonly [number, number] | null)[]>>
  >
> = {
${characterBlocks.join("\n")}
};`,
);
console.log(
  `MASTERY_NODES: ${nodeCount} nodes for ${nodes.size} characters, ${gaps} unused indices`,
);

// Game text: gt() table -> query returning (key, text_id), the key domain
// returns and its .msg id. Unk* columns keep the extractor's names.
const GAME_TEXT = {
  character: `select CharId key, 'TXT_' || CharId text_id from chara`,
  weapon: `select Key key, Name text_id from weapon`,
  sigil: `select Key key, Name text_id from gem`,
  trait: `select Key key, Name text_id from skill`,
  // Unk5 is the name, Unk6 its _CG copy, Unk7 the info text.
  skill: `select Key key, Unk5 text_id from ability`,
  item: `select Key key, ItemName text_id from item`,
  mastery: `select Key key, FullName text_id from limit_bonus_param`,
  // Unk18 names only the style perks, Unk19 is the explanation.
  masterTrait: `select Key key, Unk18 text_id from skillboard_effect`,
  summon: `select s.Key key, p.SummonName text_id from summon s join summon_param p on p.Key = s.SummonParamId`,
  summonBonus: `select Key key, Name text_id from summon_base_param`,
  fateEpisode: `select Key key, FateMissionTitle text_id from fate_episode`,
  archive: `select Key key, NoteTitle text_id from story_note_archive`,
  glossary: `select Key key, Key text_id from story_note_wordlist`,
  // Unk18 is the title on character tips; tutorial tips title elsewhere.
  tip: `select TutorialWindowIdUnlockRequirement key, Unk18 text_id from story_note_tips`,
  music: `select Key key, MusicTitle text_id from story_note_bgm`,
} satisfies Record<string, string>;

/** Output language -> .msg folder. */
const TEXT_LANGUAGES = { en: "en", ja: "jp" };

/** Decodes the MessagePack subset the .msg files use. */
function decodeMsgPack(buf: Buffer): unknown {
  let p = 0;
  const str = (n: number) => buf.toString("utf8", p, (p += n));
  const arr = (n: number) => Array.from({ length: n }, read);
  const map = (n: number) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < n; i++) obj[read() as string] = read();
    return obj;
  };
  function read(): unknown {
    const tag = buf[p++]!;
    if (tag < 0x80) return tag;
    if (tag >= 0xe0) return tag - 0x100;
    if (tag < 0x90) return map(tag & 0x0f);
    if (tag < 0xa0) return arr(tag & 0x0f);
    if (tag < 0xc0) return str(tag & 0x1f);
    const at = p;
    switch (tag) {
      case 0xc0:
        return null;
      case 0xc2:
        return false;
      case 0xc3:
        return true;
      case 0xcc:
        return buf[p++];
      case 0xcd:
        return ((p += 2), buf.readUInt16BE(at));
      case 0xce:
        return ((p += 4), buf.readUInt32BE(at));
      case 0xd0:
        return ((p += 1), buf.readInt8(at));
      case 0xd1:
        return ((p += 2), buf.readInt16BE(at));
      case 0xd2:
        return ((p += 4), buf.readInt32BE(at));
      case 0xd9:
        return str(buf[p++]!);
      case 0xda:
        return ((p += 2), str(buf.readUInt16BE(at)));
      case 0xdb:
        return ((p += 4), str(buf.readUInt32BE(at)));
      case 0xdc:
        return ((p += 2), arr(buf.readUInt16BE(at)));
      case 0xdd:
        return ((p += 4), arr(buf.readUInt32BE(at)));
      case 0xde:
        return ((p += 2), map(buf.readUInt16BE(at)));
      case 0xdf:
        return ((p += 4), map(buf.readUInt32BE(at)));
    }
    throw new Error(`msgpack: tag 0x${tag.toString(16)} at ${at - 1}`);
  }
  return read();
}

type MsgRow = {
  column_: { id_hash_: string; subid_hash_: string; text_: string };
};

/** Text id -> text for one language, preferring the row without a subid. */
function loadMsg(folder: string): Map<string, string> {
  const dir = `${textDir}/${folder}`;
  const texts = new Map<string, string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".msg") || file.endsWith("_tag.msg")) continue;
    const { rows_ } = decodeMsgPack(readFileSync(`${dir}/${file}`)) as {
      rows_: MsgRow[];
    };
    for (const { column_: c } of rows_)
      if (!c.subid_hash_ || !texts.has(c.id_hash_))
        texts.set(c.id_hash_, c.text_);
  }
  return texts;
}

mkdirSync(new URL("../src/data/text/", import.meta.url), { recursive: true });
for (const [lang, folder] of Object.entries(TEXT_LANGUAGES)) {
  const msg = loadMsg(folder);
  const out: Record<string, Record<string, string>> = {};
  const counts: string[] = [];
  for (const [table, sql] of Object.entries(GAME_TEXT)) {
    const rows = db.prepare(sql).all() as { key: unknown; text_id: unknown }[];
    const keys = new Set<string>();
    const texts = new Map<string, string>();
    for (const { key, text_id } of rows) {
      if (typeof key !== "string" || key === "") continue;
      keys.add(key);
      const text = typeof text_id === "string" ? msg.get(text_id) : undefined;
      if (text && !texts.has(key)) texts.set(key, text);
    }
    out[table] = Object.fromEntries(
      [...texts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
    counts.push(`${table} ${texts.size}/${keys.size}`);
  }
  writeFileSync(
    new URL(`../src/data/text/${lang}.json`, import.meta.url),
    `${JSON.stringify(out, null, 2)}\n`,
  );
  console.log(`text ${lang}: ${counts.join(", ")}`);
}

for (const [file, fileBlocks] of blocks) {
  const out = new URL(`../src/data/${file}.ts`, import.meta.url);
  writeFileSync(
    out,
    `// Generated by scripts/gen-data.ts from the game archive tables. Do not edit.\n\n${fileBlocks.join("\n\n")}\n`,
  );
}
