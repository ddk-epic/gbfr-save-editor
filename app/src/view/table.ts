import type { Cell, Column, SectionId, Table } from "./types";

export const table = (
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
