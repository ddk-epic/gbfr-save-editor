import {
  characterOrder,
  compareSigils,
  itemOrder,
  itemTab,
  questOrder,
  questPower,
  readArchives,
  readCharacterData,
  readConflux,
  readCounterQuests,
  readFieldNotes,
  readGlossary,
  readInventory,
  readMainStory,
  readMusic,
  readProfile,
  readSideQuests,
  readSystem,
  readTips,
  readTrophies,
  readUser,
  QUEST_DIFFICULTIES,
  ITEM_TABS,
  TROPHY_TABS,
  type Captain,
  type Conflux,
  type CounterQuest,
  type Curio,
  type Equipment,
  type Save,
  type FieldNoteCategory,
  type ItemTab,
  type Trait,
  type Trophy,
  type TrophyTab,
} from "gbfr-save-editor";
import type { GameTextTable } from "../game-text";
import type en from "../i18n/en.json";

/** An archive key gt() names at render, with an optional "Lv" suffix. */
export interface KeyCell {
  text: GameTextTable;
  key: string;
  level?: number;
  /** Numbers for the text's {0}, {1}… placeholders. */
  values?: number[];
}

/** Key cells shown in one cell, joined by `separator`. */
export interface KeyList {
  keys: KeyCell[];
  separator: string;
}

/** A value the save does not hold, shown in italics rather than as empty. */
export interface UnknownCell {
  unknown: true;
}

export const unknownCell: UnknownCell = { unknown: true };

export type Cell =
  string | number | boolean | undefined | KeyCell | KeyList | UnknownCell;

export interface Row {
  id: string;
  /** One cell per table column. */
  cells: Cell[];
}

/** Message keys under `sections` and `columns`. */
export type SectionId = keyof typeof en.sections;
export type ColumnId = keyof typeof en.columns;
export type TableLabelId = keyof typeof en.tables;

export interface Table {
  id: string;
  section: SectionId;
  /** Tab name when the section holds several tables; tables sharing a tab sit side by side. */
  tab?: string;
  /** Label above the table when it shares its tab. */
  label?: TableLabelId;
  columns: ColumnId[];
  rows: Row[];
}

/** The equipped set or one loadout: skills and sigils on the left, weapon on the right. */
export interface EquipmentSetView {
  id: string;
  /** Loadout name, undefined for what the character has equipped. */
  name: string | undefined;
  weapon: Table;
  wrightstone: Table;
  skills: Table;
  sigils: Table;
}

export const equipmentSetTables = (set: EquipmentSetView): Table[] => [
  set.weapon,
  set.wrightstone,
  set.skills,
  set.sigils,
];

export interface CharacterView {
  /** chara.CharId */
  key: string;
  level: number;
  tables: Table[];
  equipment: EquipmentSetView[];
}

export interface SaveView {
  account: Table[];
  characters: CharacterView[];
  captain: Captain | undefined;
  /** SlotData VersionMaybe. */
  slotVersion: number | undefined;
  /** Cells holding a hash the key tables could not resolve. */
  unresolved: number;
}

/** Key cells of a cell, none for plain values. */
export const keyCells = (cell: Cell): KeyCell[] =>
  typeof cell !== "object"
    ? []
    : "keys" in cell
      ? cell.keys
      : "unknown" in cell
        ? []
        : [cell];

/** True for a key the tables could not resolve, shown as "#" and 8 hex digits. */
const isUnresolvedKey = (key: string) => /^#[0-9a-f]{8}$/.test(key);

const isUnresolved = (cell: Cell) =>
  keyCells(cell).some((k) => isUnresolvedKey(k.key));

const keyCell = (
  text: GameTextTable,
  key: string | undefined,
  level?: number,
): KeyCell | undefined =>
  key === undefined ? undefined : { text, key, level };

const trait = (t: Trait | undefined) => t && keyCell("trait", t.key, t.level);

/** A curio's reward when it is a sigil, for the columns only sigils fill. */
const sigilReward = (c: Curio) =>
  c.reward?.type === "sigil" ? c.reward : undefined;

const counterQuestTables = (quests: CounterQuest[]): Table[] =>
  [...QUEST_DIFFICULTIES, undefined]
    .map((difficulty) => ({
      difficulty,
      // Ids the counter never fills sort last, and are left out entirely.
      quests: quests
        .filter(
          (q) => q.difficulty === difficulty && questOrder(q.id) !== Infinity,
        )
        .sort((a, b) => questOrder(a.id) - questOrder(b.id)),
    }))
    .filter(({ quests }) => quests.length)
    .map(({ difficulty, quests }) =>
      table(
        `quests:${difficulty ?? "other"}`,
        "quests",
        ["quest", "pwr", "clears", "grade", "lastCleared"],
        quests.map((q) => [
          keyCell("quest", q.id),
          questPower(q.id),
          q.clears || undefined,
          q.grade,
          q.lastCleared?.toISOString().slice(0, 10),
        ]),
        difficulty ?? "other",
      ),
    );

/** gt() table naming each field note category's entries, and its category key. */
const FIELD_NOTE_TEXT: Record<
  FieldNoteCategory,
  readonly [table: GameTextTable, category: string]
> = {
  characters: ["fieldNoteCharacter", "0"],
  foes: ["fieldNoteFoe", "1"],
  weapons: ["weapon", "2"],
  treasure: ["item", "3"],
  wrightstones: ["fieldNoteWrightstone", "4"],
};

/** Tab names of the item menu tabs. */
const ITEM_TAB_NAMES: Record<ItemTab, string> = {
  treasures: "treasures",
  keyItems: "key items",
};

/** One table per item menu tab in item.SortOrder. */
const itemTables = (
  items: Map<string, number>,
  wished: Set<string>,
  unseen: Set<string>,
): Table[] =>
  ITEM_TABS.map((tab) =>
    table(
      `items:${tab}`,
      "items",
      // The wish list takes materials only.
      tab === "treasures"
        ? ["item", "count", "wishList", "new"]
        : ["item", "count", "new"],
      [...items]
        .filter(([key]) => itemTab(key) === tab)
        .sort(([a], [b]) => itemOrder(a) - itemOrder(b))
        .map(([key, count]): Cell[] => [
          keyCell("item", key),
          count,
          ...(tab === "treasures" ? [wished.has(key)] : []),
          unseen.has(key),
        ]),
      ITEM_TAB_NAMES[tab],
    ),
  );

/** Tab names of the trophy tabs. */
const TROPHY_TAB_NAMES: Record<TrophyTab, string> = {
  story: "story & quest",
  character: "character",
  battle: "battle",
  gear: "gear",
  conflux: "conflux",
  summons: "summons",
  other: "other",
};

/** One table per trophy tab, base game and DLC together in journal order. */
const trophyTables = (trophies: Trophy[]): Table[] =>
  TROPHY_TABS.map((tab) =>
    table(
      `trophies:${tab}`,
      "trophies",
      ["trophy", "description", "dlc", "earned", "viewed"],
      trophies
        .filter((t) => t.tab === tab)
        .map((t) => [
          keyCell("trophy", String(t.key)),
          {
            text: "trophyDescription",
            key: String(t.key),
            values: t.quantity === undefined ? undefined : [t.quantity],
          },
          // A key the table lacks has no known origin.
          t.dlc ?? unknownCell,
          t.earned,
          t.viewed,
        ]),
      TROPHY_TAB_NAMES[tab],
    ),
  );

/** The Resonance tree and the aura collection, one tab each. */
const confluxTables = (conflux: Conflux): Table[] => [
  table(
    "conflux:resonance",
    "conflux",
    ["node", "effect", "cost", "taken"],
    conflux.resonance.map((n): Cell[] => [
      keyCell("masteryNode", n.key),
      n.effects.length
        ? {
            keys: n.effects.map((e) => ({
              text: "masteryEffect",
              key: e.key,
              values: [e.value],
            })),
            separator: " / ",
          }
        : undefined,
      n.cost,
      n.taken,
    ]),
    "resonance",
  ),
  table(
    "conflux:auras",
    "conflux",
    ["aura", "category", "obtained", "new"],
    conflux.auras.map((a): Cell[] => [
      keyCell("aura", a.key),
      // A key the table lacks has no known category.
      a.category === undefined
        ? unknownCell
        : keyCell("auraCategory", String(a.category)),
      a.obtained,
      a.obtained && !a.seen,
    ]),
    "aura collection",
  ),
];

/** Seconds as h:mm:ss. */
const duration = (seconds: number) =>
  `${Math.floor(seconds / 3600)}:${[(seconds / 60) % 60, seconds % 60]
    .map((n) => String(Math.floor(n)).padStart(2, "0"))
    .join(":")}`;

const MASTER_TRAIT_TABS: Record<string, string> = {
  SB_DEF: "insight",
  SB_ATK: "essence",
  SB_LIMIT: "crux",
};

const table = (
  id: string,
  section: SectionId,
  columns: ColumnId[],
  rows: Cell[][],
  tab?: string,
  label?: TableLabelId,
): Table => ({
  id,
  section,
  tab,
  label,
  columns,
  rows: rows.map((cells, i) => ({ id: `${id}:${i}`, cells })),
});

/** Every domain the reader knows, as tables. */
export function buildView(save: Save): SaveView {
  const units = save.slotData.units;
  const inventory = readInventory(units);
  const data = readCharacterData(units);
  const profile = readProfile(units);
  const conflux = readConflux(units);
  const user = readUser(units);
  const system = readSystem(save.systemData.units);
  const unseen = new Set(inventory.unseenItems);
  const wished = new Set(inventory.wishList);

  const account: Table[] = [
    table(
      "profile",
      "profile",
      ["field", "value"],
      [
        ["player name", user.playerName],
        ["captain", keyCell("character", data.captain) ?? unknownCell],
        ["play time", duration(system.playTime)],
        ["stage", keyCell("stage", user.stage)],
        ["spot", user.spot || undefined],
        ["party hp", user.partyHp],
        ["quests cleared", profile.questsCleared],
        ["commendations", user.commendations],
        ["rupies", inventory.rupies],
        ["mastery points", inventory.masteryPoints],
        ["resonance points", conflux.resonancePoints],
        ["online status flags", `0x${user.onlineStatusFlags.toString(16)}`],
        ["slot version", user.slotVersion],
        ["feature version", user.featureVersion],
      ],
    ),
    ...itemTables(inventory.items, wished, unseen),
    table(
      "sigils",
      "sigils",
      ["slot", "sigil", "level", "primary", "secondary", "locked", "new"],
      [...inventory.sigils]
        .sort(([slotA, a], [slotB, b]) => compareSigils(a, b) || slotA - slotB)
        .map(([slot, s]) => [
          slot,
          keyCell("sigil", s.key),
          s.level,
          keyCell("trait", s.primaryTrait?.key),
          keyCell("trait", s.secondaryTrait?.key),
          s.locked,
          !s.seen,
        ]),
    ),
    table(
      "weapons",
      "weapons",
      [
        "slot",
        "weapon",
        "uncap",
        "plus",
        "awakening",
        "transcendence",
        "questsUsed",
        "new",
      ],
      [...inventory.weapons].map(([slot, w]) => [
        slot,
        keyCell("weapon", w.key),
        w.uncap,
        w.plus,
        w.awakening,
        w.transcendence,
        w.questsUsed,
        !w.seen,
      ]),
    ),
    table(
      "wrightstones",
      "wrightstones",
      ["slot", "wrightstone", "main", "sub1", "sub2", "locked", "new"],
      [...inventory.wrightstones].map(([slot, w]) => [
        slot,
        keyCell("item", w.key),
        trait(w.traits[0]),
        trait(w.traits[1]),
        trait(w.traits[2]),
        w.locked,
        !w.seen,
      ]),
    ),
    table(
      "summons",
      "summons",
      ["id", "summon", "trait", "equipBonus", "equippedOnce", "new"],
      [...inventory.summons].map(([id, s]) => [
        id,
        keyCell("summon", s.key),
        trait(s.trait),
        s.equipBonus &&
          keyCell("summonBonus", s.equipBonus.key, s.equipBonus.level + 1),
        s.everEquipped,
        !s.seen,
      ]),
    ),
    table(
      "curios",
      "curios",
      [
        "index",
        "tier",
        "serial",
        "type",
        "reward",
        "primary",
        "secondary",
        "seed",
      ],
      inventory.curios.map((c, i) => [
        i + 1,
        c.tier,
        c.serial,
        c.reward?.type,
        c.reward &&
          (c.reward.type === "sigil"
            ? keyCell("sigil", c.reward.key, c.reward.level)
            : keyCell("item", c.reward.key)),
        keyCell("trait", sigilReward(c)?.traits[0]),
        // The save does not hold the second trait.
        sigilReward(c) &&
          (keyCell("trait", sigilReward(c)?.traits[1]) ?? unknownCell),
        c.reward && "seed" in c.reward ? c.reward.seed : undefined,
      ]),
    ),
    ...confluxTables(conflux),
    ...counterQuestTables(readCounterQuests(units)),
    table(
      "sideQuests",
      "sideQuests",
      ["quest", "accepted", "completed"],
      readSideQuests(units).map((q) => [
        keyCell("quest", q.id),
        q.accepted,
        q.completed,
      ]),
    ),
    table(
      "journal:story",
      "journal",
      ["entry", "chapter", "unlocked", "viewed"],
      readMainStory(units).map((e) => [
        keyCell("story", e.key),
        keyCell("storyChapter", String(e.chapter)),
        e.unlocked,
        e.viewed,
      ]),
      "main story",
    ),
    table(
      "journal:fieldNotes",
      "journal",
      ["entry", "category", "unlocked", "viewed"],
      readFieldNotes(units).map((e) => {
        const [text, category] = FIELD_NOTE_TEXT[e.category];
        return [
          keyCell(text, e.key),
          keyCell("fieldNoteCategory", category),
          e.unlocked,
          // Only Treasure carries a bit for it.
          e.viewed ?? unknownCell,
        ];
      }),
      "field notes",
    ),
    table(
      "journal:archive",
      "journal",
      ["entry", "unlocked", "viewed"],
      readArchives(units).map((e) => [
        keyCell("archive", e.key),
        e.unlocked,
        e.viewed,
      ]),
      "archive",
    ),
    table(
      "journal:glossary",
      "journal",
      ["entry", "unlocked", "viewed"],
      readGlossary(units).map((e) => [
        keyCell("glossary", e.key),
        e.unlocked,
        e.viewed,
      ]),
      "glossary",
    ),
    table(
      "journal:tip",
      "journal",
      ["entry", "unlocked", "viewed"],
      readTips(units).map((e) => [keyCell("tip", e.key), e.unlocked, e.viewed]),
      "tip",
    ),
    table(
      "journal:music",
      "journal",
      ["entry", "unlocked", "viewed"],
      readMusic(units).map((e) => [
        keyCell("music", e.key),
        e.unlocked,
        e.viewed,
      ]),
      "music",
    ),
    ...trophyTables(readTrophies(units)),
  ];

  const equipmentSet = (
    id: string,
    name: string | undefined,
    e: Equipment,
  ): EquipmentSetView => {
    const w = e.weapon;
    return {
      id,
      name,
      weapon: table(
        `${id}:weapon`,
        "equipment",
        ["field", "value"],
        w
          ? [
              ["weapon", keyCell("weapon", w.key)],
              ["appearance", keyCell("weapon", w.appearance)],
              ["xp", w.xp],
              ["uncap", w.uncap],
              ["plus", w.plus],
              ["awakening", w.awakening],
              ["transcendence", w.transcendence],
              ...w.traits.map((key, i): Cell[] => [
                `trait ${i + 1}`,
                keyCell("trait", key),
              ]),
              ["quests used", w.questsUsed],
            ]
          : [],
      ),
      wrightstone: table(
        `${id}:wrightstone`,
        "equipment",
        ["field", "value"],
        [
          ["wrightstone", keyCell("item", w?.wrightstone?.key)],
          ["main", trait(w?.wrightstone?.traits[0])],
          ["sub 1", trait(w?.wrightstone?.traits[1])],
          ["sub 2", trait(w?.wrightstone?.traits[2])],
        ],
      ),
      skills: table(
        `${id}:skills`,
        "equipment",
        ["slot", "skill"],
        e.skills.map((key, i) => [i + 1, keyCell("skill", key)]),
      ),
      sigils: table(
        `${id}:sigils`,
        "equipment",
        ["slot", "sigil", "level", "primary", "secondary", "locked", "new"],
        e.sigils.map((s, i) => [
          i + 1,
          keyCell("sigil", s?.key),
          s?.level,
          keyCell("trait", s?.primaryTrait?.key),
          keyCell("trait", s?.secondaryTrait?.key),
          s?.locked,
          s && !s.seen,
        ]),
      ),
    };
  };

  const characters = [...data.characters]
    .sort((a, b) => characterOrder(a.character) - characterOrder(b.character))
    .map((c): CharacterView => ({
      key: c.character,
      level: c.level,
      tables: [
        table(
          `${c.character}:level`,
          "stats",
          ["field", "value"],
          [
            ["level", c.level],
            ["xp", c.xp],
            ["base HP", c.baseHp],
            ["base ATK", c.baseAttack],
            ["quests used", c.questsUsed],
            ["master level", c.masterLevel],
            ["master XP", c.masterXp],
          ],
        ),
        table(
          `${c.character}:fateEpisodes`,
          "stats",
          ["episode", "completed"],
          c.fateEpisodes.map((f) => [
            keyCell("fateEpisode", f.key),
            f.completed,
          ]),
        ),
        table(
          `${c.character}:masteries`,
          "masteries",
          ["tree", "nodes", "msp"],
          Object.entries(c.masteries).map(([section, m]) => [
            section,
            `${m.taken}/${m.total}`,
            m.msp,
          ]),
          "all",
          "summary",
        ),
        table(
          `${c.character}:overMasteries`,
          "masteries",
          ["index", "bonus", "level"],
          c.overMasteries.map((o, i) => [
            i + 1,
            keyCell("mastery", o?.key),
            o?.level,
          ]),
          "all",
          "overMasteries",
        ),
        ...Object.entries(c.masteries).map(([section, m]) =>
          table(
            `${c.character}:masteries:${section}`,
            "masteries",
            ["node", "effect", "msp", "taken"],
            m.nodes.map((n): Cell[] => [
              keyCell("masteryNode", n.key),
              n.params.length
                ? {
                    keys: n.params.map((p) => ({
                      text: "masteryEffect",
                      key: p.key,
                      values:
                        p.bonus === undefined ? [p.value] : [p.value, p.bonus],
                    })),
                    separator: " / ",
                  }
                : undefined,
              n.msp,
              n.taken,
            ]),
            section,
          ),
        ),
        ...Object.entries(MASTER_TRAIT_TABS).map(([style, tab]) =>
          table(
            `${c.character}:masterTraits:${tab}`,
            "masterTraits",
            ["rank", "trait", "chosen"],
            c.masterTraits
              .filter((t) => t.style === style)
              .map((t): Cell[] => [
                t.perk ? `${t.rank} perk` : t.rank,
                {
                  text: "masterTrait",
                  key: t.key,
                  values: t.values.map((v, i) => v * (t.valueScales[i] ?? 1)),
                },
                t.chosen,
              ]),
            tab,
          ),
        ),
      ],
      equipment: [
        equipmentSet(`${c.character}:equipped`, undefined, c),
        ...data.loadouts
          .filter((l) => l.character === c.character)
          .map((l, i) =>
            equipmentSet(`${c.character}:loadout:${i}`, l.name, l),
          ),
      ],
    }));

  const unresolved = [
    ...account,
    ...characters.flatMap((c) => [
      ...c.tables,
      ...c.equipment.flatMap(equipmentSetTables),
    ]),
  ]
    .flatMap((t) => t.rows)
    .reduce((n, r) => n + r.cells.filter(isUnresolved).length, 0);

  return {
    account,
    characters,
    captain: data.captain,
    slotVersion: save.slotData.version,
    unresolved,
  };
}
