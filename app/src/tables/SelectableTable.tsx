import type { ReactNode } from "react";
import { select, useSelectedRow } from "../state/selection";
import { DataTable, TableLabel } from "../ui/DataTable";
import type { Table } from "../view";

/** A DataTable whose rows select into the row panel. */
export function SelectableTable({
  table,
  heading,
  flush,
}: {
  table: Table;
  heading?: ReactNode;
  flush?: boolean;
}) {
  const selectedRowId = useSelectedRow(table.id);
  return (
    <DataTable
      table={table}
      heading={heading}
      flush={flush}
      selectedRowId={selectedRowId}
      onSelect={(rowId) => select({ tableId: table.id, rowId })}
    />
  );
}

/** A SelectableTable under a label, with an optional menu at the label's right. */
export function LabeledTable({
  label,
  table,
  menu,
  flush,
}: {
  label: string;
  table: Table;
  menu?: ReactNode;
  flush?: boolean;
}) {
  return (
    <SelectableTable
      table={table}
      flush={flush}
      heading={
        <>
          <TableLabel>{label}</TableLabel>
          {menu && <div className="ml-auto">{menu}</div>}
        </>
      }
    />
  );
}
