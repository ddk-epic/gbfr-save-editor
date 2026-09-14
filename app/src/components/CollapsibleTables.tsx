import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sectionId, type Selection } from "../navigation";
import type { Table } from "../save/view";
import { DataTable } from "./DataTable";

/** Tables as a list of sections that open and close by their header. */
export function CollapsibleTables({
  tables,
  isOpen,
  onToggle,
  selection,
  onSelect,
}: {
  tables: Table[];
  isOpen: (table: Table) => boolean;
  onToggle: (table: Table) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="divide-y divide-border border-b border-border">
      {tables.map((table) => {
        const open = isOpen(table);
        return (
          <section
            key={table.id}
            id={sectionId(table.id)}
            className="scroll-mt-72"
          >
            <button
              onClick={() => onToggle(table)}
              className="flex w-full items-center gap-2 py-2 text-left hover:bg-muted"
            >
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-strong-foreground">
                {t(`sections.${table.section}`)}
              </span>
              <span className="text-faint-foreground">{table.rows.length}</span>
            </button>
            {open && (
              <DataTable
                table={table}
                selectedRowId={selection?.row.id}
                onSelect={(rowId) =>
                  onSelect({
                    table,
                    row: table.rows.find((r) => r.id === rowId)!,
                  })
                }
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Expand all / collapse all, for a page header. */
export function ExpandCollapseActions({
  onExpandAll,
  onCollapseAll,
}: {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <button
        className="text-subtle-foreground hover:text-strong-foreground"
        onClick={onExpandAll}
      >
        {t("account.expandAll")}
      </button>
      <button
        className="text-subtle-foreground hover:text-strong-foreground"
        onClick={onCollapseAll}
      >
        {t("account.collapseAll")}
      </button>
    </>
  );
}
