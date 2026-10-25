import {
  compareSigils,
  itemOrder,
  itemTab,
  questOrder,
  questPower,
  readArchives,
  readConflux,
  readCounterQuests,
  readFieldNotes,
  readGlossary,
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
  type CharacterData,
  type Conflux,
  type CounterQuest,
  type Curio,
  type Save,
  type FieldNoteCategory,
  type ItemTab,
  type Trophy,
  type TrophyTab,
  type Inventory,
} from "gbfr-save-editor";
import type { GameTextTable } from "../i18n/game-text";
import { keyCell, trait, unknownCell } from "./cell";
import { table } from "./table";
import type { Cell, Table } from "./types";

/** profile 4706, from 1. */
const SKYFARER_GRADES = [
  "Veteran Skyfarer",
  "Zegagrande Legend",
  "Fatebreaker",
  "Fatebreaker (Infinity)",
];

/** A curio's reward when it is a sigil. */
const sigilReward = (c: Curio) =>
  c.reward?.type === "sigil" ? c.reward : undefined;

const counterQuestTables = (quests: CounterQuest[]): Table[] =>
  [...QUEST_DIFFICULTIES, undefined]
    .map((difficulty) => ({
      difficulty,
      // Leaves out ids the counter never fills.
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

/** The save page's tables. */
export function buildShared(
  save: Save,
  data: CharacterData,
  inventory: Inventory,
): Table[] {
  const units = save.slotData.units;
  const profile = readProfile(units);
  const conflux = readConflux(units);
  const user = readUser(units);
  const system = readSystem(save.systemData.units);
  const unseen = new Set(inventory.unseenItems);
  const wished = new Set(inventory.wishList);

  return [
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
        ["index", 2],
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
}
