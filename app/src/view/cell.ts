import type { Trait } from "gbfr-save-editor";
import type { GameTextTable } from "../i18n/game-text";
import type { Cell, KeyCell, UnknownCell } from "./types";

export const unknownCell: UnknownCell = { unknown: true };

export const keyCell = (
  text: GameTextTable,
  key: string | undefined,
  level?: number,
): KeyCell | undefined =>
  key === undefined ? undefined : { text, key, level };

export const trait = (t: Trait | undefined) =>
  t && keyCell("trait", t.key, t.level);

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

export const isUnresolved = (cell: Cell) =>
  keyCells(cell).some((k) => isUnresolvedKey(k.key));
