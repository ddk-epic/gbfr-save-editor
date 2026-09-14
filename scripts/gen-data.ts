// Generates the src/data/ tables (hash -> key per archive table, masteries, master traits).
// pnpm gen:data [tables.sqlite]
import { writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { hashId } from "../src/hash/xxhash32-custom";

const [dbPath = "../gbfr-extract/tables.sqlite"] = process.argv.slice(2);

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

for (const [file, fileBlocks] of blocks) {
  const out = new URL(`../src/data/${file}.ts`, import.meta.url);
  writeFileSync(
    out,
    `// Generated by scripts/gen-data.ts from the game archive tables. Do not edit.\n\n${fileBlocks.join("\n\n")}\n`,
  );
}
