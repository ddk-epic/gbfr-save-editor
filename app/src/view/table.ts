import type {
  Cell,
  Column,
  RowEdit,
  SectionId,
  Table,
  TableAction,
} from "./types";

/** The actions whose gate holds, in order. */
export const listed = (gated: [boolean, TableAction][]): TableAction[] =>
  gated.flatMap(([gate, action]) => (gate ? [action] : []));

export const table = (
  id: string,
  section: SectionId,
  columns: Column[],
  rows: (Cell[] | { cells: Cell[]; edit: RowEdit })[],
  {
    stretch,
    tab,
    label,
    uiLabel,
    wide,
    actions,
  }: Pick<Table, "stretch" | "tab" | "label" | "uiLabel" | "wide" | "actions">,
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
    actions,
    rows: rows.map((row, i) => ({
      id: `${id}:${i}`,
      ...(Array.isArray(row) ? { cells: row } : row),
    })),
  };
};
