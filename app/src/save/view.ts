import {
  characterOrder,
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
  type Captain,
  type Equipment,
  type Save,
  type Trait,
} from "gbfr-save-editor";
import type { GameTextTable } from "../game-text";
import type en from "../i18n/en.json";

/** An archive key gt() names at render, with an optional "Lv" suffix. */
export interface KeyCell {
  text: GameTextTable;
  key: string;
  level?: number;
}

/** Key cells shown in one cell, joined by `separator`. */
export interface KeyList {
  keys: KeyCell[];
  separator: string;
}

export type Cell = string | number | boolean | undefined | KeyCell | KeyList;

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
  /** Tab name when the section holds several tables. */
  tab?: string;
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
  captain: Captain | undefined;
  /** SlotData VersionMaybe. */
  slotVersion: number | undefined;
  /** Cells holding a hash the key tables could not resolve. */
  unresolved: number;
}

/** Key cells of a cell, none for plain values. */
export const keyCells = (cell: Cell): KeyCell[] =>
  typeof cell !== "object" ? [] : "keys" in cell ? cell.keys : [cell];

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

/** Key cells for the defined keys, undefined when there are none. */
const keyList = (
  text: GameTextTable,
  keys: (string | undefined)[],
): KeyList | undefined => {
  const cells = keys.flatMap((key) =>
    key === undefined ? [] : [{ text, key }],
  );
  return cells.length ? { keys: cells, separator: ", " } : undefined;
};

const trait = (t: Trait | undefined) => t && keyCell("trait", t.key, t.level);

const traitList = (traits: Trait[]): KeyList | undefined =>
  traits.length
    ? {
        keys: traits.map((t) => ({
          text: "trait",
          key: t.key,
          level: t.level,
        })),
        separator: " / ",
      }
    : undefined;

const table = (
  id: string,
  section: SectionId,
  columns: ColumnId[],
  rows: Cell[][],
  tab?: string,
): Table => ({
  id,
  section,
  tab,
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
          keyCell("item", key),
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
        keyCell("sigil", s.key),
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
        keyCell("weapon", w.key),
        w.uncap,
        w.plus,
        w.awakening,
        w.transcendence,
        keyList("trait", w.traits),
        w.wrightstone && traitList(w.wrightstone.traits),
        keyCell("weapon", w.appearance),
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
      ["index", "curio", "type", "reward"],
      inventory.curios.map((c, i) => [
        i + 1,
        keyCell("item", c.key),
        c.reward?.type,
        c.reward &&
          (c.reward.type === "sigil"
            ? keyCell("sigil", c.reward.key, c.reward.level)
            : keyCell("item", c.reward.key)),
      ]),
    ),
    table(
      "quests:side",
      "quests",
      ["quest", "accepted", "completed"],
      readSideQuests(units).map((q) => [q.id, q.accepted, q.completed]),
      "side",
    ),
    table(
      "quests:counter",
      "quests",
      ["quest", "clears", "perfectGrade", "lastCleared"],
      readCounterQuests(units).map((q) => [
        q.id,
        q.clears,
        q.perfectGrade,
        q.lastCleared?.toISOString().slice(0, 10),
      ]),
      "counter",
    ),
    table(
      "journal:archive",
      "journal",
      ["entry", "unlocked", "viewed"],
      readArchives(units).map((e) => [
        keyCell("archive", e.key),
        e.obtained,
        e.viewed,
      ]),
      "archive",
    ),
    table(
      "journal:glossary",
      "journal",
      ["entry", "unlocked", "viewed", "paragraphs"],
      readGlossary(units).map((e) => [
        keyCell("glossary", e.key),
        e.listed,
        e.viewed,
        e.paragraphs,
      ]),
      "glossary",
    ),
    table(
      "journal:tip",
      "journal",
      ["entry", "unlocked", "viewed"],
      readTips(units).map((e) => [keyCell("tip", e.key), e.listed, e.viewed]),
      "tip",
    ),
    table(
      "journal:music",
      "journal",
      ["entry", "unlocked", "viewed"],
      readMusic(units).map((e) => [
        keyCell("music", e.key),
        e.listed,
        e.viewed,
      ]),
      "music",
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
    keyCell("weapon", e.weapon?.key),
    `${e.sigils.filter(Boolean).length}/${e.sigils.length}`,
    keyList(
      "sigil",
      e.sigils.map((s) => s?.key),
    ),
    keyList("skill", e.skills),
  ];

  const characters = [...data.characters]
    .sort((a, b) => characterOrder(a.character) - characterOrder(b.character))
    .map((c): CharacterView => ({
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
              keyCell("fateEpisode", f.key),
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
              keyCell("mastery", o?.key),
              o && `Lv ${o.level}`,
            ]),
            ...c.masterTraits.map((t): Cell[] => [
              t.style,
              keyCell("masterTrait", t.key),
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
    captain: data.captain,
    slotVersion: save.slotData.version,
    unresolved,
  };
}
