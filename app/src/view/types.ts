import type { Captain } from "gbfr-save-editor";
import type { GameTextTable } from "../i18n/game-text";
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

/** A value the save does not hold, shown in italics. */
export interface UnknownCell {
  unknown: true;
}

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

export interface CharacterView {
  /** chara.CharId */
  key: string;
  /** The character's own entity. */
  entity: number;
  level: number;
  belowMaxLevel: boolean;
  belowMaxMasterLevel: boolean;
  overMasteryRolled: boolean;
  fateEpisodesIncomplete: boolean;
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
