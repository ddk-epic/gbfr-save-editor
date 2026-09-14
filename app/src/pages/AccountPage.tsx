import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DataTable } from "../components/DataTable";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import { sectionId, type Selection } from "../navigation";
import type { Table } from "../save/view";

export function AccountPage({
  fileName,
  tables,
  open,
  setOpen,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  tables: Table[];
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
  const { t } = useTranslation();
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  return (
    <>
      <PageTop
        crumbs={[fileName, t("contents.account")]}
        title={t("contents.account")}
        onRoot={onRoot}
        actions={
          <>
            <button
              className="text-subtle-foreground hover:text-strong-foreground"
              onClick={() => setOpen(new Set(tables.map((t) => t.id)))}
            >
              {t("account.expandAll")}
            </button>
            <button
              className="text-subtle-foreground hover:text-strong-foreground"
              onClick={() => setOpen(new Set())}
            >
              {t("account.collapseAll")}
            </button>
          </>
        }
      >
        <RowPanel selected={selection} />
      </PageTop>
      <div className="divide-y divide-border border-b border-border">
        {tables.map((table) => {
          const isOpen = open.has(table.id);
          return (
            <section
              key={table.id}
              id={sectionId(table.id)}
              className="scroll-mt-72"
            >
              <button
                onClick={() => toggle(table.id)}
                className="flex w-full items-center gap-2 py-2 text-left hover:bg-muted"
              >
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <span className="text-strong-foreground">
                  {t(`sections.${table.section}`)}
                </span>
                <span className="text-faint-foreground">
                  {table.rows.length}
                </span>
              </button>
              {isOpen && (
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
    </>
  );
}
