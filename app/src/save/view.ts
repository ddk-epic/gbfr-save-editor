import {
  readArchives,
  readCharacterData,
  readCounterQuests,
  readEarnedTrophies,
  readGlossary,
  readInventory,
  readMusic,
  readProfile,
  readSideQuests,
  readTips,
  type Equipment,
  type Save,
  type Trait,
} from "gbfr-save-editor";
import type en from "../i18n/en.json";

export type Cell = string | number | boolean | undefined;

export interface Row {
  id: string;
  /** One cell per table column. */
  cells: Cell[];
}

/** Message keys under `sections` and `columns`. */
export type SectionId = keyof typeof en.sections;
export type ColumnId = keyof typeof en.columns;

export interface Table {
  id: string;
  section: SectionId;
  columns: ColumnId[];
  rows: Row[];
}

export interface CharacterView {
  /** chara.CharId */
  key: string;
  level: number;
  tables: Table[];
}

export interface SaveView {
  account: Table[];
  characters: CharacterView[];
  /** SlotData VersionMaybe. */
  slotVersion: number | undefined;
  /** Cells holding a hash the key tables could not resolve. */
  unresolved: number;
}

/** True for a key the tables could not resolve, shown as "#" and 8 hex digits. */
export const isUnresolved = (cell: Cell) =>
  typeof cell === "string" && /^#[0-9a-f]{8}$/.test(cell);

const trait = (t: Trait | undefined) => t && `${t.key} Lv ${t.level}`;

const table = (
  id: string,
  section: SectionId,
  columns: ColumnId[],
  rows: Cell[][],
): Table => ({
  id,
  section,
  columns,
  rows: rows.map((cells, i) => ({ id: `${id}:${i}`, cells })),
});

/** Every domain the reader knows, as tables. */
export function buildView(save: Save): SaveView {
  const units = save.slotData.units;
  const inventory = readInventory(units);
  const data = readCharacterData(units);
  const profile = readProfile(units);
  const unseen = new Set(inventory.unseenItems);
  const wished = new Set(inventory.wishList);

  const account: Table[] = [
    table(
      "profile",
      "profile",
      ["field", "value"],
      [["quests cleared", profile.questsCleared]],
    ),
    table(
      "items",
      "items",
      ["item", "count", "wishList", "new"],
      [
        ["rupies", inventory.rupies, undefined, undefined],
        ["mastery points", inventory.masteryPoints, undefined, undefined],
        ...[...inventory.items].map(([key, count]): Cell[] => [
          key,
          count,
          wished.has(key),
          unseen.has(key),
        ]),
      ],
    ),
    table(
      "sigils",
      "sigils",
      ["slot", "sigil", "level", "primary", "secondary", "locked", "new"],
      [...inventory.sigils].map(([slot, s]) => [
        slot,
        s.key,
        s.level,
        trait(s.primaryTrait),
        trait(s.secondaryTrait),
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
        "traits",
        "wrightstone",
        "appearance",
        "questsUsed",
        "new",
      ],
      [...inventory.weapons].map(([slot, w]) => [
        slot,
        w.key,
        w.uncap,
        w.plus,
        w.awakening,
        w.transcendence,
        w.traits.filter(Boolean).join(", ") || undefined,
        w.wrightstone?.traits.map(trait).join(" / "),
        w.appearance,
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
        w.key,
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
        s.key,
        trait(s.trait),
        s.equipBonus && `${s.equipBonus.key} Lv ${s.equipBonus.level + 1}`,
        s.everEquipped,
        !s.seen,
      ]),
    ),
    table(
      "curios",
      "curios",
      ["index", "curio", "reward"],
      inventory.curios.map((c, i) => [
        i + 1,
        c.key,
        c.reward &&
          (c.reward.kind === "sigil"
            ? `sigil ${c.reward.key} Lv ${c.reward.level}`
            : `${c.reward.kind} ${c.reward.key}`),
      ]),
    ),
    table(
      "quests",
      "quests",
      [
        "quest",
        "kind",
        "accepted",
        "completed",
        "clears",
        "perfectGrade",
        "lastCleared",
      ],
      [
        ...readSideQuests(units).map((q): Cell[] => [
          q.id,
          "side",
          q.accepted,
          q.completed,
          undefined,
          undefined,
          undefined,
        ]),
        ...readCounterQuests(units).map((q): Cell[] => [
          q.id,
          "counter",
          undefined,
          undefined,
          q.clears,
          q.perfectGrade,
          q.lastCleared?.toISOString().slice(0, 10),
        ]),
      ],
    ),
    table(
      "journal",
      "journal",
      ["entry", "kind", "unlocked", "viewed", "paragraphs"],
      [
        ...readArchives(units).map((e): Cell[] => [
          e.key,
          "archive",
          e.obtained,
          e.viewed,
          undefined,
        ]),
        ...readGlossary(units).map((e): Cell[] => [
          e.key,
          "glossary",
          e.listed,
          e.viewed,
          e.paragraphs,
        ]),
        ...readTips(units).map((e): Cell[] => [
          e.key,
          "tip",
          e.listed,
          e.viewed,
          undefined,
        ]),
        ...readMusic(units).map((e): Cell[] => [
          e.key,
          "music",
          e.listed,
          e.viewed,
          undefined,
        ]),
      ],
    ),
    table(
      "trophies",
      "trophies",
      ["earnedTrophy"],
      readEarnedTrophies(units).map((key) => [key]),
    ),
  ];

  const equipmentRow = (label: string, e: Equipment): Cell[] => [
    label,
    e.weapon?.key,
    `${e.sigils.filter(Boolean).length}/${e.sigils.length}`,
    e.sigils
      .filter((s) => s !== undefined)
      .map((s) => s.key)
      .join(", ") || undefined,
    e.skills.filter(Boolean).join(", ") || undefined,
  ];

  const characters = data.characters.map((c): CharacterView => ({
    key: c.character,
    level: c.level,
    tables: [
      table(
        `${c.character}:progress`,
        "progress",
        ["entry", "value", "completed"],
        [
          ["level", c.level, undefined],
          ["xp", c.xp, undefined],
          ["base HP", c.baseHp, undefined],
          ["base ATK", c.baseAttack, undefined],
          ["quests used", c.questsUsed, undefined],
          ["master level", c.masterLevel, undefined],
          ["master XP", c.masterXp, undefined],
          ...c.fateEpisodes.map((f): Cell[] => [
            f.key,
            "fate episode",
            f.completed,
          ]),
        ],
      ),
      table(
        `${c.character}:masteries`,
        "masteries",
        ["entry", "detail", "value"],
        [
          ...Object.entries(c.masteries).map(([section, m]): Cell[] => [
            section,
            `${m.taken}/${m.total} nodes`,
            `${m.msp} MSP`,
          ]),
          ...c.overMasteries.map((o, i): Cell[] => [
            `over-mastery ${i + 1}`,
            o?.key,
            o && `Lv ${o.level}`,
          ]),
          ...c.masterTraits.map((t): Cell[] => [
            t.style,
            t.key,
            t.position === undefined
              ? `${t.rank} perk`
              : `${t.rank} #${t.position}`,
          ]),
        ],
      ),
      table(
        `${c.character}:equipment`,
        "equipment",
        ["loadout", "weapon", "sigilSlots", "sigils", "skills"],
        [
          equipmentRow("current", c),
          ...data.loadouts
            .filter((l) => l.character === c.character)
            .map((l) => equipmentRow(l.name, l)),
        ],
      ),
    ],
  }));

  const unresolved = [...account, ...characters.flatMap((c) => c.tables)]
    .flatMap((t) => t.rows)
    .reduce((n, r) => n + r.cells.filter(isUnresolved).length, 0);

  return {
    account,
    characters,
    slotVersion: save.slotData.version,
    unresolved,
  };
}
