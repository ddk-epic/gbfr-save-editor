import { Lock } from "lucide-react";
import { formatCell } from "./DataTable";
import { isUnresolved, type Row, type Table } from "../save/view";

/** The edit panel above the tables. */
export function RowPanel({ selected }: { selected: { table: Table; row: Row } | undefined }) {
  return (
    <div className="min-h-[112px] rounded-sm border border-border bg-card p-3 text-card-foreground">
      {selected ? (
        <>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[11px] tracking-widest text-subtle-foreground uppercase">Row</span>
            <span className="text-strong-foreground">{formatCell(selected.row.cells[1] ?? selected.row.cells[0])}</span>
            <span className="rounded-sm bg-secondary px-1.5 text-secondary-foreground">{selected.table.label}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {selected.table.columns.map((column, i) => {
              const cell = selected.row.cells[i];
              return (
                <div key={column} className="flex flex-col gap-1 text-sm">
                  <span className="text-xs tracking-wide text-subtle-foreground uppercase">{column}</span>
                  <span className={`flex items-center gap-1.5 ${isUnresolved(cell) ? "text-faint-foreground" : "text-foreground"}`}>
                    <Lock size={12} className="text-faint-foreground" /> {formatCell(cell)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-faint-foreground">Read-only until editing ships.</p>
        </>
      ) : (
        <p className="pt-8 text-center text-faint-foreground">No row selected. Click a row below to see it here.</p>
      )}
    </div>
  );
}
