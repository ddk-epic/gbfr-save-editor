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
  readRecentPlayers,
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
import { equippableWeapons } from "gbfr-save-editor/edit";
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

/** A column and its width in letters. */
export type Column = [id: ColumnId, width: number];

export interface Table {
  id: string;
  section: SectionId;
  /** Tab name when the section holds several tables; tables sharing a tab sit side by side. */
  tab?: string;
  /** Label above the table when it shares its tab. */
  label?: TableLabelId;
  /** Each column with its width in letters on a wide screen, padding aside. */
  columns: Column[];
  /** The column that also takes the width the others leave. */
  stretch: ColumnId;
  rows: Row[];
}

/** A column shrinks down to this share of its width, rounded up, before the table scrolls. */
export const SHRINK_FACTOR = 0.5;

/** The equipped set or one loadout: skills and sigils on the left, weapon on the right. */
export interface EquipmentSetView {
  id: string;
  /** Loadout name, undefined for what the character has equipped. */
  name: string | undefined;
  /** From 1. */
  partySet?: number;
  weapon: Table;
  /** Weapons the character can equip, empty on a set that is not the live one. */
  weaponOptions: { id: number; key: string; series: number | undefined }[];
  /** The character entity the live gear sits on, undefined on a loadout or party set. */
  characterEntity: number | undefined;
  wrightstone: Table;
  wrightstoneWeaponId: number | undefined;
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
  shared: Table[];
  /** The characters landing page. */
  party: Table[];
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

/** profile 4706, from 1. */
const SKYFARER_GRADES = [
  "Veteran Skyfarer",
  "Zegagrande Legend",
  "Fatebreaker",
  "Fatebreaker (Infinity)",
];

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
        [
          ["quest", 48],
          ["pwr", 6],
          ["clears", 6],
          ["grade", 5],
          ["lastCleared", 12],
        ],
        quests.map((q) => [
          keyCell("quest", q.id),
          questPower(q.id),
          q.clears || undefined,
          q.grade,
          q.lastCleared?.toISOString().slice(0, 10),
        ]),
        { stretch: "quest", tab: difficulty ?? "other" },
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
        ? [
            ["item", 48],
            ["count", 5],
            ["wishList", 6],
            ["new", 5],
          ]
        : [
            ["item", 48],
            ["count", 5],
            ["new", 5],
          ],
      [...items]
        .filter(([key]) => itemTab(key) === tab)
        .sort(([a], [b]) => itemOrder(a) - itemOrder(b))
        .map(([key, count]): Cell[] => [
          keyCell("item", key),
          count,
          ...(tab === "treasures" ? [wished.has(key)] : []),
          unseen.has(key),
        ]),
      { stretch: "item", tab: ITEM_TAB_NAMES[tab] },
    ),
  );

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
      [
        ["trophy", 36],
        ["description", 60],
        ["dlc", 5],
        ["earned", 6],
        ["new", 5],
      ],
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
          t.earned && !t.seen,
        ]),
      { stretch: "description", tab: TROPHY_TAB_NAMES[tab] },
    ),
  );

/** The Resonance tree and the aura collection, one tab each. */
const confluxTables = (conflux: Conflux): Table[] => [
  table(
    "conflux:resonance",
    "conflux",
    [
      ["node", 30],
      ["effect", 60],
      ["cost", 5],
      ["taken", 5],
    ],
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
    { stretch: "effect", tab: "resonance" },
  ),
  table(
    "conflux:auras",
    "conflux",
    [
      ["aura", 36],
      ["category", 36],
      ["obtained", 6],
      ["new", 5],
    ],
    conflux.auras.map((a): Cell[] => [
      keyCell("aura", a.key),
      // A key the table lacks has no known category.
      a.category === undefined
        ? unknownCell
        : keyCell("auraCategory", String(a.category)),
      a.obtained,
      a.obtained && !a.seen,
    ]),
    { stretch: "aura", tab: "aura collection" },
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
  columns: Column[],
  rows: Cell[][],
  { stretch, tab, label }: Pick<Table, "stretch" | "tab" | "label">,
): Table => {
  if (!columns.some(([id]) => id === stretch))
    throw new Error(`${id}: stretch column ${stretch} is not a column`);
  return {
    id,
    section,
    tab,
    label,
    columns,
    stretch,
    rows: rows.map((cells, i) => ({ id: `${id}:${i}`, cells })),
  };
};

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

  const shared: Table[] = [
    table(
      "profile",
      "profile",
      [
        ["field", 36],
        ["value", 18],
      ],
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
      { stretch: "field", tab: "profile", label: "summary" },
    ),
    table(
      "profile:characters",
      "profile",
      [
        ["field", 12],
        ["character", 24],
        ["level", 5],
        ["masterLevel", 5],
        ["questsUsed", 8],
      ],
      [
        ["last played", profile.lastPlayed] as const,
        ...profile.mostUsed.map((m, i) => [`most used ${i + 1}`, m] as const),
      ].map(([field, m]): Cell[] => [
        field,
        keyCell("character", m?.character),
        m?.level,
        m?.masterLevel,
        m?.questsUsed,
      ]),
      { stretch: "character", tab: "profile", label: "cardCharacters" },
    ),
    ...itemTables(inventory.items, wished, unseen),
    table(
      "sigils",
      "sigils",
      [
        ["slot", 7],
        ["sigil", 40],
        ["level", 5],
        ["primary", 36],
        ["secondary", 36],
        ["locked", 6],
        ["new", 5],
      ],
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
      { stretch: "sigil" },
    ),
    table(
      "weapons",
      "weapons",
      [
        ["slot", 4],
        ["weapon", 48],
        ["uncap", 5],
        ["plus", 4],
        ["awakening", 6],
        ["transcendence", 6],
        ["questsUsed", 8],
        ["new", 5],
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
      { stretch: "weapon" },
    ),
    table(
      "wrightstones",
      "wrightstones",
      [
        ["slot", 7],
        ["wrightstone", 48],
        ["main", 36],
        ["sub1", 36],
        ["sub2", 36],
        ["locked", 6],
        ["new", 5],
      ],
      [...inventory.wrightstones].map(([slot, w]) => [
        slot,
        keyCell("item", w.key),
        trait(w.traits[0]),
        trait(w.traits[1]),
        trait(w.traits[2]),
        w.locked,
        !w.seen,
      ]),
      { stretch: "wrightstone" },
    ),
    table(
      "summons",
      "summons",
      [
        ["id", 4],
        ["summon", 36],
        ["trait", 36],
        ["equipBonus", 36],
        ["equippedOnce", 7],
        ["new", 5],
      ],
      [...inventory.summons].map(([id, s]) => [
        id,
        keyCell("summon", s.key),
        trait(s.trait),
        s.equipBonus &&
          keyCell("summonBonus", s.equipBonus.key, s.equipBonus.level + 1),
        s.everEquipped,
        !s.seen,
      ]),
      { stretch: "summon" },
    ),
    table(
      "curios",
      "curios",
      [
        ["index", 3],
        ["tier", 4],
        ["serial", 7],
        ["type", 12],
        ["reward", 60],
        ["primary", 36],
        ["secondary", 30],
        ["seed", 13],
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
      { stretch: "reward" },
    ),
    ...confluxTables(conflux),
    ...counterQuestTables(readCounterQuests(units)),
    table(
      "sideQuests",
      "sideQuests",
      [
        ["quest", 60],
        ["accepted", 10],
        ["completed", 10],
      ],
      readSideQuests(units).map((q) => [
        keyCell("quest", q.id),
        q.accepted,
        q.completed,
      ]),
      { stretch: "quest" },
    ),
    table(
      "journal:story",
      "journal",
      [
        ["entry", 60],
        ["chapter", 36],
        ["unlocked", 8],
        ["new", 5],
      ],
      readMainStory(units).map((e) => [
        keyCell("story", e.key),
        keyCell("storyChapter", String(e.chapter)),
        e.unlocked,
        e.unlocked && !e.seen,
      ]),
      { stretch: "entry", tab: "main story" },
    ),
    table(
      "journal:fieldNotes",
      "journal",
      [
        ["entry", 60],
        ["category", 36],
        ["unlocked", 8],
        ["new", 5],
      ],
      readFieldNotes(units).map((e) => {
        const [text, category] = FIELD_NOTE_TEXT[e.category];
        return [
          keyCell(text, e.key),
          keyCell("fieldNoteCategory", category),
          e.unlocked,
          // Only Treasure carries a bit for it.
          e.seen === undefined ? unknownCell : e.unlocked && !e.seen,
        ];
      }),
      { stretch: "entry", tab: "field notes" },
    ),
    table(
      "journal:archive",
      "journal",
      [
        ["entry", 60],
        ["unlocked", 6],
        ["new", 5],
      ],
      readArchives(units).map((e) => [
        keyCell("archive", e.key),
        e.unlocked,
        e.unlocked && !e.seen,
      ]),
      { stretch: "entry", tab: "archive" },
    ),
    table(
      "journal:glossary",
      "journal",
      [
        ["entry", 60],
        ["unlocked", 6],
        ["new", 5],
      ],
      readGlossary(units).map((e) => [
        keyCell("glossary", e.key),
        e.unlocked,
        e.unlocked && !e.seen,
      ]),
      { stretch: "entry", tab: "glossary" },
    ),
    table(
      "journal:tip",
      "journal",
      [
        ["entry", 60],
        ["unlocked", 6],
        ["new", 5],
      ],
      readTips(units).map((e) => [
        keyCell("tip", e.key),
        e.unlocked,
        e.unlocked && !e.seen,
      ]),
      { stretch: "entry", tab: "tip" },
    ),
    table(
      "journal:music",
      "journal",
      [
        ["entry", 60],
        ["unlocked", 6],
        ["new", 5],
      ],
      readMusic(units).map((e) => [
        keyCell("music", e.key),
        e.unlocked,
        e.unlocked && !e.seen,
      ]),
      { stretch: "entry", tab: "music" },
    ),
    ...trophyTables(readTrophies(units)),
    table(
      "recentPlayers",
      "recentPlayers",
      [
        ["player", 18],
        ["grade", 21],
        ["clears", 6],
        ["quest", 42],
        ["lastPlayed", 24],
        ["mostUsed", 42],
        ["lastSeen", 19],
      ],
      readRecentPlayers(units).map((p): Cell[] => [
        p.name,
        SKYFARER_GRADES[p.grade - 1] ?? p.grade,
        p.questsCleared,
        keyCell("quest", p.quest),
        p.lastPlayed &&
          keyCell("character", p.lastPlayed.character, p.lastPlayed.level),
        {
          keys: p.mostUsed.flatMap((m) =>
            m ? [{ text: "character", key: m.character }] : [],
          ),
          separator: ", ",
        },
        p.lastSeen.toISOString().slice(0, 16).replace("T", " "),
      ]),
      { stretch: "mostUsed" },
    ),
  ];

  const party: Table[] = [
    table(
      "party:current",
      "party",
      [
        ["index", 4],
        ["character", 24],
        ["level", 5],
      ],
      data.party.map((key, i) => [
        i + 1,
        keyCell("character", key),
        data.characters.find((c) => c.character === key)?.level,
      ]),
      { stretch: "character", tab: "party", label: "currentParty" },
    ),
    table(
      "party:sets",
      "party",
      [
        ["set", 4],
        ["members", 60],
      ],
      data.partySets.flatMap((members, set): Cell[][] =>
        members
          ? [
              [
                set + 1,
                {
                  keys: members.flatMap((m) =>
                    m ? [{ text: "character", key: m.character }] : [],
                  ),
                  separator: ", ",
                },
              ],
            ]
          : [],
      ),
      { stretch: "members", tab: "party", label: "partySets" },
    ),
  ];

  const equipmentSet = (
    id: string,
    name: string | undefined,
    e: Equipment & { skills: (string | undefined)[] },
    characterEntity?: number,
  ): EquipmentSetView => {
    const w = e.weapon;
    return {
      id,
      name,
      characterEntity,
      weaponOptions:
        characterEntity === undefined
          ? []
          : equippableWeapons(units, characterEntity).map(
              ({ id, key, series }) => ({
                id,
                key,
                series,
              }),
            ),
      weapon: table(
        `${id}:weapon`,
        "gear",
        [
          ["field", 12],
          ["value", 30],
        ],
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
        { stretch: "value" },
      ),
      wrightstoneWeaponId: w?.wrightstone ? w.id : undefined,
      wrightstone: table(
        `${id}:wrightstone`,
        "gear",
        [
          ["field", 12],
          ["value", 30],
        ],
        [
          ["wrightstone", keyCell("item", w?.wrightstone?.key)],
          ["main", trait(w?.wrightstone?.traits[0])],
          ["sub 1", trait(w?.wrightstone?.traits[1])],
          ["sub 2", trait(w?.wrightstone?.traits[2])],
        ],
        { stretch: "value" },
      ),
      skills: table(
        `${id}:skills`,
        "gear",
        [
          ["slot", 4],
          ["skill", 40],
        ],
        e.skills.map((key, i) => [i + 1, keyCell("skill", key)]),
        { stretch: "skill" },
      ),
      sigils: table(
        `${id}:sigils`,
        "gear",
        [
          ["slot", 4],
          ["sigil", 36],
          ["level", 6],
          ["primary", 32],
          ["secondary", 32],
          ["locked", 6],
          ["new", 3],
        ],
        e.sigils.map((s, i) => [
          i + 1,
          keyCell("sigil", s?.key),
          s?.level,
          keyCell("trait", s?.primaryTrait?.key),
          keyCell("trait", s?.secondaryTrait?.key),
          s?.locked,
          s && !s.seen,
        ]),
        { stretch: "sigil" },
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
          [
            ["field", 32],
            ["value", 14],
          ],
          [
            ["level", c.level],
            ["xp", c.xp],
            ["base HP", c.baseHp],
            ["base ATK", c.baseAttack],
            ["quests used", c.questsUsed],
            ["master level", c.masterLevel],
            ["master XP", c.masterXp],
          ],
          { stretch: "field" },
        ),
        table(
          `${c.character}:fateEpisodes`,
          "stats",
          [
            ["episode", 40],
            ["completed", 10],
          ],
          c.fateEpisodes.map((f) => [
            keyCell("fateEpisode", f.key),
            f.completed,
          ]),
          { stretch: "episode" },
        ),
        table(
          `${c.character}:masteries`,
          "masteries",
          [
            ["tree", 20],
            ["nodes", 10],
            ["msp", 8],
          ],
          Object.entries(c.masteries).map(([section, m]) => [
            section,
            `${m.taken}/${m.total}`,
            m.msp,
          ]),
          { stretch: "tree", tab: "all", label: "summary" },
        ),
        table(
          `${c.character}:overMasteries`,
          "masteries",
          [
            ["index", 4],
            ["bonus", 40],
            ["level", 5],
          ],
          c.overMasteries.map((o, i) => [
            i + 1,
            keyCell("mastery", o?.key),
            o?.level,
          ]),
          { stretch: "bonus", tab: "all", label: "overMasteries" },
        ),
        ...Object.entries(c.masteries).map(([section, m]) =>
          table(
            `${c.character}:masteries:${section}`,
            "masteries",
            [
              ["node", 32],
              ["effect", 60],
              ["msp", 6],
              ["taken", 5],
            ],
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
            { stretch: "effect", tab: section },
          ),
        ),
        ...Object.entries(MASTER_TRAIT_TABS).map(([style, tab]) =>
          table(
            `${c.character}:masterTraits:${tab}`,
            "masterTraits",
            [
              ["rank", 10],
              ["trait", 36],
              ["chosen", 6],
            ],
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
            { stretch: "trait", tab },
          ),
        ),
      ],
      equipment: [
        equipmentSet(`${c.character}:equipped`, undefined, c, c.entity),
        ...data.loadouts
          .filter((l) => l.character === c.character)
          .map((l, i) =>
            equipmentSet(`${c.character}:loadout:${i}`, l.name, l),
          ),
        ...data.partySets.flatMap((members, set) =>
          (members ?? [])
            .filter((m) => m?.character === c.character)
            .map((m) => ({
              ...equipmentSet(`${c.character}:partySet:${set}`, undefined, m!),
              partySet: set + 1,
            })),
        ),
      ],
    }));

  const unresolved = [
    ...shared,
    ...party,
    ...characters.flatMap((c) => [
      ...c.tables,
      ...c.equipment.flatMap(equipmentSetTables),
    ]),
  ]
    .flatMap((t) => t.rows)
    .reduce((n, r) => n + r.cells.filter(isUnresolved).length, 0);

  return {
    shared,
    party,
    characters,
    captain: data.captain,
    slotVersion: save.slotData.version,
    unresolved,
  };
}
