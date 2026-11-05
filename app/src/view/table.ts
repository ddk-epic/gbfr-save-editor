import type { Cell, Column, SectionId, Table } from "./types";

export const table = (
  id: string,
  section: SectionId,
  columns: Column[],
  rows: Cell[][],
  {
    stretch,
    tab,
    label,
    uiLabel,
    wide,
  }: Pick<Table, "stretch" | "tab" | "label" | "uiLabel" | "wide">,
): Table => {
  if (!columns.some(([id]) => id === stretch))
    throw new Error(`${id}: stretch column ${stretch} is not a column`);
  return {
    id,
    section,
    tab,
    label,
    uiLabel,
    wide,
    columns,
    stretch,
    rows: rows.map((cells, i) => ({ id: `${id}:${i}`, cells })),
  };
};
