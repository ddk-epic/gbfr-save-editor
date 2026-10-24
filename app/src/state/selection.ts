import { allTables, type Row, type Table } from "../view";
import { useView } from "./save";
import { useWatched, Watched } from "./watched";

/** A row by id, valid across edits that keep its table. */
export interface RowRef {
  tableId: string;
  rowId: string;
}

export interface Selection {
  table: Table;
  row: Row;
}

const selected = new Watched<RowRef | undefined>(undefined);

export const select = (ref: RowRef | undefined) => selected.set(ref);
export const clearSelection = () => selected.set(undefined);

/** The selected row's id when it sits in `tableId`. */
export const useSelectedRow = (tableId: string) =>
  useWatched(selected, (ref) =>
    ref?.tableId === tableId ? ref.rowId : undefined,
  );

/** The selection as set, a new object on every select. */
export const useSelectedRef = () => useWatched(selected);

/** The selected table and row in the current view. */
export function useSelection(): Selection | undefined {
  const ref = useSelectedRef();
  const view = useView();
  if (!ref || !view) return undefined;
  const table = allTables(view).find((t) => t.id === ref.tableId);
  const row = table?.rows.find((r) => r.id === ref.rowId);
  return table && row && { table, row };
}
