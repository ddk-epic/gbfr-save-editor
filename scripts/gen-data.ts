// Generates the src/data/ tables (hash -> key per archive table, masteries, master traits)
// and src/data/text/ (key -> game text per language).
// pnpm gen:data [tables.sqlite] [text dir]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { hashId } from "../src/core/xxhash32-custom";

const [
  dbPath = "../gbfr-extract/tables.sqlite",
  textDir = "../gbfr-extract/system/table/text",
] = process.argv.slice(2);

type DataFile =
  | "characters"
  | "master-traits"
  | "masteries"
  | "over-masteries"
  | "weapons"
  | "sigils"
  | "skills"
  | "items"
  | "summons"
  | "journal"
  | "trophies"
  | "quests"
  | "conflux";

/** Export name -> output file, table and key column. */
const SOURCES = {
  CHARACTER_KEYS: ["characters", "chara", "CharId"],
  WEAPON_KEYS: ["weapons", "weapon", "Key"],
  GEM_KEYS: ["sigils", "gem", "Key"],
  SKILL_KEYS: ["sigils", "skill", "Key"],
  ABILITY_KEYS: ["skills", "ability", "Key"],
  ITEM_KEYS: ["items", "item", "Key"],
  LIMIT_BONUS_PARAM_KEYS: ["over-masteries", "limit_bonus_param", "Key"],
  SKILLBOARD_EFFECT_KEYS: ["master-traits", "skillboard_effect", "Key"],
  SUMMON_KEYS: ["summons", "summon", "Key"],
  SUMMON_BASE_PARAM_KEYS: ["summons", "summon_base_param", "Key"],
  FATE_EPISODE_KEYS: ["characters", "fate_episode", "Key"],
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

// Master trait cell by skillboard_effect key: [category, rank, board order, perk].
// Ranks by skillboard_group key, in unlock order.
const RANKS: Record<string, string> = {
  "68DE92AC": "r1",
  A96D9EBC: "r2",
  "4A5DDC7B": "r3",
  "3B99904D": "ex",
};
const cells = (
  db
    .prepare(
      "select SkillboardEffectOrUiId as effect, SkillboardCategoryId as category, SkillboardGroupId as grp, Unk25 as weight, Unk30 as board_order from skillboard_layout",
    )
    .all() as {
    effect: string;
    category: string;
    grp: string;
    weight: number;
    board_order: number;
  }[]
).map(({ effect, category, grp, weight, board_order }) => {
  const rank = RANKS[grp];
  if (!rank) throw new Error(`skillboard_layout: unknown group ${grp}`);
  // Unk25 is 100 on the three perk cells of a style and 50 elsewhere.
  const hash = UNNAMED_KEY.test(effect) ? parseInt(effect, 16) : hashId(effect);
  return `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify([category, rank, board_order, weight === 100])},`;
});

// {n} in a trait's text is Value(n % 10 + 1) of action part n / 10.
const actionParts = db
  .prepare("select * from skillboard_effect_action_parts")
  .all() as Record<string, unknown>[];
const partValues = new Map(
  actionParts.map((part) => [
    part.Key as string,
    Array.from(
      { length: 10 },
      (_, i) => Math.round((part[`Value${i + 1}`] as number) * 1000) / 1000,
    ),
  ]),
);
// Stun Power, SubType 8 with MainType 8, is stored at 1/10 of what the game shows.
const partScales = new Map(
  actionParts.map((part) => [
    part.Key as string,
    part.SubType === 8 && part.MainType === 8 ? 10 : 1,
  ]),
);
const traitValues: string[] = [];
const traitScales: string[] = [];
for (const effect of db
  .prepare(
    "select Key, SkillboardEffectActionPartsId1 as p1, SkillboardEffectActionPartsId2 as p2, SkillboardEffectActionPartsId3 as p3 from skillboard_effect order by Key",
  )
  .all() as { Key: string; p1: string; p2: string; p3: string }[]) {
  const parts = [effect.p1, effect.p2, effect.p3];
  const values = parts.flatMap((part) => {
    if (!part) return Array<number>(10).fill(0);
    const found = partValues.get(part);
    if (!found)
      throw new Error(
        `skillboard_effect ${effect.Key}: no action part ${part}`,
      );
    return found;
  });
  const scales = parts.flatMap((part) =>
    Array<number>(10).fill(part ? partScales.get(part)! : 1),
  );
  while (values.at(-1) === 0) values.pop();
  while (scales.at(-1) === 1) scales.pop();
  if (values.length)
    traitValues.push(
      `  ${JSON.stringify(effect.Key)}: [${values.join(", ")}],`,
    );
  if (scales.length)
    traitScales.push(
      `  ${JSON.stringify(effect.Key)}: [${scales.join(", ")}],`,
    );
}
emit(
  "master-traits",
  `/** skillboard_layout by skillboard_effect key hash, ${cells.length} cells: [category, rank, board order (Unk30), perk]. */
export const SKILLBOARD_CELLS: Readonly<
  Record<number, readonly [string, "r1" | "r2" | "r3" | "ex", number, boolean]>
> = {
${cells.sort().join("\n")}
};

/** skillboard_effect.Key -> Value1-10 of action parts 1-3 as stored, flat, for {0}-{29} in its text. */
export const MASTER_TRAIT_VALUES: Readonly<Record<string, readonly number[]>> = {
${traitValues.join("\n")}
};

/** skillboard_effect.Key -> what a stored value is multiplied by to display it, 1 past the list. */
export const MASTER_TRAIT_VALUE_SCALES: Readonly<
  Record<string, readonly number[]>
> = {
${traitScales.join("\n")}
};`,
);
console.log(
  `SKILLBOARD_CELLS: ${cells.length} cells, MASTER_TRAIT_VALUES: ${traitValues.length}, scaled ${traitScales.length}`,
);

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

// Inventory order: items by item.SortOrder, sigils by trait's skill.InventorySortOrder.
for (const [file, name, table, column] of [
  ["items", "ITEM_SORT_ORDER", "item", "SortOrder"],
  ["sigils", "TRAIT_INVENTORY_SORT_ORDER", "skill", "InventorySortOrder"],
] as const) {
  const rows = (
    db
      .prepare(`select Key, "${column}" as sortOrder from "${table}"`)
      .all() as {
      Key: string;
      sortOrder: number;
    }[]
  ).map(({ Key, sortOrder }) => `  ${JSON.stringify(Key)}: ${sortOrder},`);
  emit(
    file,
    `/** ${table}.${column} by ${table}.Key. */
export const ${name}: Readonly<Record<string, number>> = {
${rows.sort().join("\n")}
};`,
  );
  console.log(`${name}: ${rows.length} keys`);
}

// A sigil's own traits: SkillId1, and SkillId2 on the sigils that carry two.
// A gem without a SkillId2 rolls its second trait, SkillTypeLotIdForRandom2ndSkill.
const gemTraits = (
  db.prepare("select Key, SkillId1, SkillId2 from gem").all() as {
    Key: string;
    SkillId1: string;
    SkillId2: string;
  }[]
)
  .filter(({ SkillId1 }) => SkillId1 !== "")
  .map(
    ({ Key, SkillId1, SkillId2 }) =>
      `  ${JSON.stringify(Key)}: ${JSON.stringify(SkillId2 === "" ? [SkillId1] : [SkillId1, SkillId2])},`,
  );
emit(
  "sigils",
  `/** skill.Key of a sigil's own traits by gem.Key, SkillId1 then SkillId2. */
export const GEM_TRAITS: Readonly<Record<string, readonly string[]>> = {
${gemTraits.sort().join("\n")}
};`,
);
console.log(`GEM_TRAITS: ${gemTraits.length} gems`);

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
const nodes = new Map<string, Map<number, [number, number, number][]>>();
/** limit_bonus key hash -> key. */
const bonusKeys = new Map<number, string>();
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
      `select CharaId, LimitBonusId, LimitBonusParamIndex, MspCost, NodeGridLocation, DiffSeparatorMaybe, ReqWepTranscensionLevel from "${tree}"`,
    )
    .all() as {
    CharaId: string;
    LimitBonusId: string;
    LimitBonusParamIndex: number;
    MspCost: number;
    NodeGridLocation: number;
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
    bonusKeys.set(hash, row.LimitBonusId);
    let byBonus = nodes.get(row.CharaId);
    if (!byBonus) nodes.set(row.CharaId, (byBonus = new Map()));
    const ladder = byBonus.get(hash) ?? [];
    byBonus.set(hash, ladder);
    if (ladder[row.LimitBonusParamIndex])
      throw new Error(
        `${tree}: ${row.CharaId} ${row.LimitBonusId} index ${row.LimitBonusParamIndex} twice`,
      );
    ladder[row.LimitBonusParamIndex] = [
      section,
      row.MspCost,
      row.NodeGridLocation,
    ];
    nodeCount++;
  }
}

// Node effects: limit_bonus ParamId1-3 name up to three limit_bonus_param
// effects, each filling {0} of its own format text with Lv{n}Value at
// LimitBonusParamIndex n - 1. T7 transcendence texts read {0} from Lv9Value,
// the T1-6 value, and the <d> bonus {1} from Lv10Value.
const bonusParams = new Map<string, string[]>();
for (const row of db
  .prepare(`select Key, ParamId1, ParamId2, ParamId3 from limit_bonus`)
  .all() as Record<string, string>[]) {
  const params = [row.ParamId1, row.ParamId2, row.ParamId3].filter(
    (param): param is string => !!param,
  );
  const known = bonusParams.get(row.Key!);
  if (known && known.join() !== params.join())
    throw new Error(`limit_bonus ${row.Key} twice with other params`);
  bonusParams.set(row.Key!, params);
}
const paramValues = new Map<string, number[]>();
for (const row of db.prepare(`select * from limit_bonus_param`).all() as Record<
  string,
  number | string
>[]) {
  // Stun Power (DisplayNumberMultiplier 3) is stored at a tenth of its display.
  const scale = row.DisplayNumberMultiplier === 3 ? 10 : 1;
  paramValues.set(
    row.Key as string,
    Array.from(
      { length: 10 },
      (_, i) =>
        Math.round((row[`Lv${i + 1}Value`] as number) * scale * 1000) / 1000,
    ),
  );
}
const usedParams = new Set<string>();
const bonusBlock = [...bonusKeys]
  .sort(([a], [b]) => a - b)
  .map(([hash, key]) => {
    const params = (bonusParams.get(key) ?? []).filter((param) =>
      paramValues.has(param),
    );
    params.forEach((param) => usedParams.add(param));
    return `  0x${hash.toString(16).padStart(8, "0")}: ${JSON.stringify([key, ...params])},`;
  });
const paramBlock = [...usedParams]
  .sort()
  .map(
    (param) =>
      `  ${JSON.stringify(param)}: ${JSON.stringify(paramValues.get(param))},`,
  );
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
          node ? `[${node.join(", ")}]` : "null",
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
 * [section index, MspCost, NodeGridLocation] per LimitBonusParamIndex, null
 * for an unused index.
 */
export const MASTERY_NODES: Readonly<
  Record<
    string,
    Readonly<
      Record<number, readonly (readonly [number, number, number] | null)[]>
    >
  >
> = {
${characterBlocks.join("\n")}
};

/** limit_bonus key hash -> [limit_bonus.Key, ...limit_bonus_param keys of ParamId1-3]. */
export const MASTERY_BONUSES: Readonly<Record<number, readonly string[]>> = {
${bonusBlock.join("\n")}
};

/** limit_bonus_param.Key -> Lv1Value-Lv10Value as displayed, for the params mastery nodes use. */
export const MASTERY_PARAM_VALUES: Readonly<Record<string, readonly number[]>> = {
${paramBlock.join("\n")}
};`,
);
console.log(
  `MASTERY_NODES: ${nodeCount} nodes for ${nodes.size} characters, ${gaps} unused indices`,
);

// Resonance tree: every endlessmode_tree row in table order. The save keeps one
// 1602 bitmask per distinct bonus (Unk19, a limit_bonus key), and Unk24 is the
// node's bit in it, as LimitBonusParamIndex is for masteries. A node's effect is
// its bonus's limit_bonus_param values at that index.
const treeRows = db
  .prepare(
    "select Unk19 as bonus, Unk24 as bit, Unk25 as cost from endlessmode_tree",
  )
  .all() as { bonus: string; bit: number; cost: number }[];
const treeBlock = treeRows.map(({ bonus, bit, cost }) => {
  if (bit > 7) throw new Error(`endlessmode_tree ${bonus}: bit ${bit} past 7`);
  const hash = UNNAMED_KEY.test(bonus) ? parseInt(bonus, 16) : hashId(bonus);
  const effects = (bonusParams.get(bonus) ?? [])
    .filter((param) => paramValues.has(param))
    .map((param) => [param, paramValues.get(param)![bit]!]);
  return `  [0x${hash.toString(16).padStart(8, "0")}, ${JSON.stringify(bonus)}, ${bit}, ${cost}, ${JSON.stringify(effects)}],`;
});

// Aura collection: every endlessmode_buff row by KeyMaybe, the collection's sort
// order. Unk105 is the key the save holds, Unk109 the category.
const auraRows = db
  .prepare(
    "select Unk105 as key, Unk109 as category, KeyMaybe as sortOrder from endlessmode_buff order by KeyMaybe, Unk105",
  )
  .all() as { key: string; category: number; sortOrder: number }[];
const auraBlock = auraRows.map(
  ({ key, category }) =>
    `  [0x${parseInt(key, 16).toString(16).padStart(8, "0")}, ${JSON.stringify(key)}, ${category}],`,
);
emit(
  "conflux",
  `/** endlessmode_tree rows in table order, ${treeRows.length} nodes: bonus hash, limit_bonus.Key,
 * the node's bit in the bonus's 1602 bitmask (Unk24), cost (Unk25), and the limit_bonus_param
 * effects with their value at that bit. */
export const CONFLUX_TREE: readonly (readonly [
  hash: number,
  bonus: string,
  bit: number,
  cost: number,
  effects: readonly (readonly [param: string, value: number])[],
])[] = [
${treeBlock.join("\n")}
];

/** endlessmode_buff rows in collection order (KeyMaybe), ${auraRows.length} auras: Unk105 hash, Unk105, category (Unk109). */
export const CONFLUX_AURAS: readonly (readonly [
  hash: number,
  key: string,
  category: number,
])[] = [
${auraBlock.join("\n")}
];`,
);
console.log(
  `CONFLUX_TREE: ${treeRows.length} nodes, CONFLUX_AURAS: ${auraRows.length} auras`,
);

// Weapon series by key hash, weapon.Unk30. The traits each series carries name it:
// 1 holds Stun Power, 3 Critical Hit Rate, 4 HP and Garrison, 5 Weak Point DMG,
// while 0 and 2 are the Terminus and Ascension weapons. 6 sits on the unnamed
// _07 weapons. Every character has one weapon of each series.
const weaponRows = db
  .prepare("select Key, Unk30 as series from weapon order by Key")
  .all() as { Key: string; series: number }[];
emit(
  "weapons",
  `/** weapon.Key hash -> weapon series (weapon.Unk30), ${weaponRows.length} weapons. */
export const WEAPON_SERIES: Readonly<Record<number, number>> = {
${weaponRows
  .filter(({ Key }) => Key !== "")
  .map(
    ({ Key, series }) =>
      `  0x${hashId(Key).toString(16).padStart(8, "0")}: ${series},`,
  )
  .join("\n")}
};`,
);
console.log(`WEAPON_SERIES: ${weaponRows.length} weapons`);

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
  masteryNode: `select Key key, NodeTitle text_id from limit_bonus`,
  // Unique bonuses keep their format in FormatText1, the rest in NameFormat.
  masteryEffect: `select Key key, coalesce(nullif(FormatText1, ''), NameFormat) text_id from limit_bonus_param`,
  // Unk18 is the style title on the r1 perks, Unk19 the trait text.
  masterTrait: `select Key key, Unk19 text_id from skillboard_effect`,
  summon: `select s.Key key, p.SummonName text_id from summon s join summon_param p on p.Key = s.SummonParamId`,
  summonBonus: `select Key key, Name text_id from summon_base_param`,
  fateEpisode: `select Key key, FateMissionTitle text_id from fate_episode`,
  archive: `select Key key, NoteTitle text_id from story_note_archive`,
  // Unk4 is the entry title, Unk5 its summary; Unk6 and Unk7 repeat both.
  story: `select Key key, Unk4 text_id from story`,
  // Note numbers the chapter, "Prologue"; The Story So Far has none.
  storyChapter: `select cast(Key as text) key, Title text_id, Note prefix_id from story_note_chapter`,
  fieldNoteCharacter: `select Key key, CharacterName text_id from story_note_picturebook_chara`,
  fieldNoteFoe: `select EnemyId key, EnemyName text_id from story_note_picturebook_enemy`,
  fieldNoteWrightstone: `select Key key, ItemName1 text_id from story_note_picturebook_code`,
  fieldNoteCategory: `select cast(Key as text) key, Name text_id from story_note_picturebook_category`,
  glossary: `select Key key, Key text_id from story_note_wordlist`,
  // Unk18 is the title on character tips; tutorial tips title elsewhere.
  tip: `select TutorialWindowIdUnlockRequirement key, Unk18 text_id from story_note_tips`,
  music: `select Key key, MusicTitle text_id from story_note_bgm`,
  // A quest title is TXT_QR_ and the quest id without its leading "00".
  quest: `select Key key, 'TXT_QR_' || substr(Key, 3) text_id from quest_baseinfo_ex_data`,
  trophy: `select cast(Key as text) key, Name text_id from badge`,
  trophyDescription: `select cast(Key as text) key, Description text_id from badge`,
  stage: `select PhaseId key, Name text_id from stagename`,
  aura: `select Unk105 key, BuffName text_id from endlessmode_buff`,
  // No table names the weapon series; weapon.Unk30 indexes these labels, and 6 has none.
  weaponSeries: `select '0' key, 'TXT_PAU_WEP_TYPE_BAHAMUT' text_id
    union all select '1', 'TXT_PAU_WEP_TYPE_STUN'
    union all select '2', 'TXT_PAU_WEP_TYPE_AWAKE'
    union all select '3', 'TXT_PAU_WEP_TYPE_CRI'
    union all select '4', 'TXT_PAU_WEP_DEFENSE'
    union all select '5', 'TXT_PAU_WEP_TYPE_WEAK'
    union all select '7', 'TXT_PAU_WEP_TYPE_PRIVILEGE'`,
  // No table names the categories; the collection's type labels are in category order.
  auraCategory: `select '0' key, 'TXT_KKTN_BFCHIC_TYPE_BREATH' text_id
    union all select '1', 'TXT_KKTN_BFCHIC_TYPE_ISOLATION'
    union all select '2', 'TXT_KKTN_BFCHIC_TYPE_TUTELARY'
    union all select '3', 'TXT_KKTN_BFCHIC_TYPE_AWE'
    union all select '4', 'TXT_KKTN_BFCHIC_TYPE_DESTROY'
    union all select '5', 'TXT_KKTN_BFCHIC_TYPE_CONFLICT'
    union all select '6', 'TXT_KKTN_BFCHIC_TYPE_DISASTER'
    union all select '7', 'TXT_KKTN_BFCHIC_TYPE_RESCUE'
    union all select '8', 'TXT_KKTN_BFCHIC_TYPE_CHAOS'`,
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
/** Quest names in en, for the comments on the quest counter list. */
let questNames: Record<string, string> = {};
/** Main story entry titles in en, for the comments on the story order. */
let storyNames: Record<string, string> = {};
/** Trophy names in en, for the comments on the trophy list. */
let trophyNames: Record<string, string> = {};
for (const [lang, folder] of Object.entries(TEXT_LANGUAGES)) {
  const msg = loadMsg(folder);
  const out: Record<string, Record<string, string>> = {};
  const counts: string[] = [];
  for (const [table, sql] of Object.entries(GAME_TEXT)) {
    const rows = db.prepare(sql).all() as {
      key: unknown;
      text_id: unknown;
      prefix_id?: unknown;
    }[];
    const keys = new Set<string>();
    const texts = new Map<string, string>();
    for (const { key, text_id, prefix_id } of rows) {
      if (typeof key !== "string" || key === "") continue;
      keys.add(key);
      const body = typeof text_id === "string" ? msg.get(text_id) : undefined;
      // A query with a prefix_id puts that text first, as the game does with
      // "Prologue" before "The Forgotten Sky". An empty one drops away.
      const prefix =
        typeof prefix_id === "string" ? msg.get(prefix_id) : undefined;
      const text = body && prefix ? `${prefix} ${body}` : body;
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
  if (lang === "en") {
    questNames = out.quest ?? {};
    storyNames = out.story ?? {};
    trophyNames = out.trophy ?? {};
  }
}

// Main Story order: every `story` row by chapter, the rows the chapter lists
// first in their `Unk12` order, then its in-game events by key. The Story So Far
// lists its `tt` rows, which carry no position; every other chapter lists the
// rows with a position.
const storyRows = db
  .prepare(
    "select Key, Unk10 as chapter, Unk12 as pos, Unk13 as kind from story",
  )
  .all() as { Key: string; chapter: number; pos: number; kind: number }[];
const listed = (r: (typeof storyRows)[number]) =>
  r.chapter === 0 ? r.kind === 2 : r.pos !== 0;
const storyOrder = [...storyRows].sort(
  (a, b) =>
    a.chapter - b.chapter ||
    Number(listed(b)) - Number(listed(a)) ||
    a.pos - b.pos ||
    a.Key.localeCompare(b.Key),
);
emit(
  "journal",
  `/** \`story\` keys in Main Story order, with the \`story_note_chapter\` key of each, ${storyOrder.length} rows. */
export const STORY_ORDER: readonly (readonly [key: string, chapter: number])[] = [
${storyOrder
  .map(
    (r) =>
      `  ["${r.Key}", ${r.chapter}], // ${listed(r) ? "" : "unlisted, "}${storyNames[r.Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
);

// The two Field Notes categories with no list of their own in the save. Weapons
// and Treasure are read off the weapon and item units, so the rows each category
// covers have to come from the tables. Both lists hold every row the category
// draws from, the way Characters holds both captains: the Weapons counter of 154
// then leaves out the captain not picked and the two Apocalypse weapons, and the
// Treasure counter of 252 shows the 4 Curios as one.
const fieldNoteWeapons = db
  .prepare(
    "select Key, CharaId from weapon where unk52 = 1 and (WeaponId is null or WeaponId = '') order by CharaId, Key",
  )
  .all() as { Key: string; CharaId: string }[];
const fieldNoteTreasure = db
  .prepare(
    "select Key from item where SortOrder between 100 and 922 order by SortOrder",
  )
  .all() as { Key: string }[];
const keyList = (rows: { Key: string }[]) =>
  rows.map((r) => `  ${JSON.stringify(r.Key)},`).join("\n");
emit(
  "journal",
  `/** \`weapon\` keys the Field Notes Weapons category draws from, ${fieldNoteWeapons.length} rows. */
export const FIELD_NOTE_WEAPONS: readonly string[] = [
${keyList(fieldNoteWeapons)}
];

/** \`item\` keys the Field Notes Treasure category draws from, ${fieldNoteTreasure.length} rows in SortOrder order. */
export const FIELD_NOTE_TREASURE: readonly string[] = [
${keyList(fieldNoteTreasure)}
];`,
);
console.log(
  `FIELD_NOTE_WEAPONS: ${fieldNoteWeapons.length}, FIELD_NOTE_TREASURE: ${fieldNoteTreasure.length}`,
);

// Trophies: every `badge` row in SortOrder order, the order the journal lists.
// No column names the tab. Each tab is a contiguous SortOrder block, base game
// first and Endless Ragnarok after, so the tabs are cut at the first SortOrder
// of each block. The blocks are in research/save-units.md.
const TROPHY_TABS = [
  "story",
  "character",
  "battle",
  "gear",
  "conflux",
  "summons",
  "other",
] as const;
const TROPHY_TAB_STARTS: [
  sortOrder: number,
  tab: (typeof TROPHY_TABS)[number],
][] = [
  [0, "story"],
  [134, "character"],
  [354, "battle"],
  [514, "gear"],
  [645, "other"],
  [819, "story"],
  [876, "character"],
  [1160, "battle"],
  [1207, "gear"],
  [1428, "conflux"],
  [1534, "summons"],
  [1568, "other"],
];
const DLC_START = 819;
const badges = db
  .prepare(
    "select Key, SortOrder, IsEndlessRagnarok as dlc, ReqQuantity from badge order by SortOrder, Key",
  )
  .all() as {
  Key: number;
  SortOrder: number;
  dlc: number;
  ReqQuantity: number;
}[];
for (const b of badges)
  if (b.SortOrder >= DLC_START !== (b.dlc === 1))
    throw new Error(
      `badge ${b.Key}: SortOrder ${b.SortOrder} and IsEndlessRagnarok ${b.dlc} disagree`,
    );
const trophyTab = (sortOrder: number) =>
  [...TROPHY_TAB_STARTS].reverse().find(([start]) => start <= sortOrder)![1];
emit(
  "trophies",
  `/** The journal's trophy tabs, base game and Endless Ragnarok together. */
export const TROPHY_TABS = ${JSON.stringify(TROPHY_TABS)} as const;

export type TrophyTab = (typeof TROPHY_TABS)[number];

/** \`badge\` rows in SortOrder order: Key, tab, IsEndlessRagnarok, and ReqQuantity, the
 * {0} of the descriptions that have one. ${badges.length} rows. */
export const TROPHIES: readonly (readonly [
  key: number,
  tab: TrophyTab,
  dlc: boolean,
  quantity: number,
])[] = [
${badges
  .map(
    (b) =>
      `  [${b.Key}, "${trophyTab(b.SortOrder)}", ${b.dlc === 1}, ${b.ReqQuantity}], // ${trophyNames[b.Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
);
console.log(
  `TROPHIES: ${badges.length} rows, ${badges.filter((b) => b.dlc).length} Endless Ragnarok`,
);

// Quest counter list: every quest whose row carries a counter flag, in the
// order the tables give, difficulty then advised PWR then id. That is close to
// the counter's own order but not it: within one power band the counter has an
// order of its own that no column or table row order explains, and Maniac lists
// two quests outside their band. Difficulty is the id's fifth digit, 1 to B.
const DIFFICULTIES = [
  "easy",
  "normal",
  "hard",
  "very hard",
  "extreme",
  "maniac",
  "proud",
  "chaos",
  "chaos+",
  "chaos++",
  "infinity",
];
/** Unk25 on a quest the counter lists. A quest id it never fills holds 0. */
const COUNTER_FLAGS = [102, 103, 110];
/** Gulp... So These Are the Rumored Monsters, listed but carrying no flag. */
const UNFLAGGED_COUNTER_QUEST = "00405308";
const questRows = db
  .prepare("select Key, AdvisedPWR, Unk25 from quest_baseinfo_ex_data")
  .all() as { Key: string; AdvisedPWR: number; Unk25: number }[];
const counterQuests = questRows
  .filter(
    (r) =>
      /^0040[1-9AB]/.test(r.Key) &&
      r.AdvisedPWR > 0 &&
      (COUNTER_FLAGS.includes(r.Unk25) || r.Key === UNFLAGGED_COUNTER_QUEST),
  )
  .sort(
    (a, b) =>
      parseInt(a.Key[4]!, 16) - parseInt(b.Key[4]!, 16) ||
      a.AdvisedPWR - b.AdvisedPWR ||
      a.Key.localeCompare(b.Key),
  );
emit(
  "quests",
  `/** Quest id and quest_baseinfo_ex_data.AdvisedPWR, in quest counter order, ${counterQuests.length} quests. */
export const QUEST_COUNTER: readonly (readonly [id: string, pwr: number])[] = [
${counterQuests
  .map(
    ({ Key, AdvisedPWR }) =>
      `  ["${Key}", ${AdvisedPWR}], // ${DIFFICULTIES[parseInt(Key[4]!, 16) - 1] ?? "?"} ${questNames[Key] ?? "(unnamed)"}`,
  )
  .join("\n")}
];`,
);
console.log(
  `QUEST_COUNTER: ${counterQuests.length} quests, ${counterQuests.filter((r) => !questNames[r.Key]).length} unnamed`,
);

for (const [file, fileBlocks] of blocks) {
  const out = new URL(`../src/data/${file}.ts`, import.meta.url);
  writeFileSync(
    out,
    `// Generated by scripts/gen-data.ts from the game archive tables. Do not edit.\n\n${fileBlocks.join("\n\n")}\n`,
  );
}
