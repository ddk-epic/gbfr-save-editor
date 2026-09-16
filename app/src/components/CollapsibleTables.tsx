import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { sectionId, type Selection } from "../navigation";
import type { SectionId, Table } from "../save/view";
import { DataTable, TableLabel } from "./DataTable";

/** Tables as sections that open and close by their header; tables sharing a section are its tabs, tables sharing a tab its halves. */
export function CollapsibleTables({
  tables,
  isOpen,
  onToggle,
  selection,
  onSelect,
  before,
  children,
}: {
  tables: Table[];
  isOpen: (section: SectionId) => boolean;
  onToggle: (section: SectionId) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  /** Sections with their own layout, before the table sections. */
  before?: ReactNode;
  /** Sections with their own layout, after the table sections. */
  children?: ReactNode;
}) {
  const sections = new Map<SectionId, Table[]>();
  for (const table of tables)
    sections.set(table.section, [
      ...(sections.get(table.section) ?? []),
      table,
    ]);
  return (
    <div className="divide-y divide-border border-b border-border">
      {before}
      {[...sections].map(([section, group]) => (
        <Section
          key={section}
          section={section}
          tables={group}
          open={isOpen(section)}
          onToggle={() => onToggle(section)}
          selection={selection}
          onSelect={onSelect}
        />
      ))}
      {children}
    </div>
  );
}

/** A section that opens and closes by its header. */
export function CollapsibleSection({
  section,
  count,
  open,
  onToggle,
  children,
}: {
  section: SectionId;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section id={sectionId(section)}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-2 text-left hover:bg-muted"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-strong-foreground">
          {t(`sections.${section}`)}
        </span>
        <span className="text-faint-foreground">{count}</span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </section>
  );
}

function Section({
  section,
  tables,
  open,
  onToggle,
  selection,
  onSelect,
}: {
  section: SectionId;
  tables: Table[];
  open: boolean;
  onToggle: () => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
}) {
  const { t } = useTranslation();
  const tabs = new Map<string, Table[]>();
  for (const table of tables) {
    const tab = table.tab ?? table.id;
    tabs.set(tab, [...(tabs.get(tab) ?? []), table]);
  }
  const [tabName, setTabName] = useState(tabs.keys().next().value!);
  const shown = tabs.get(tabName) ?? tabs.values().next().value!;
  const tabBar = tabs.size > 1 && (
    <div className="flex w-full border-b border-border">
      {[...tabs].map(([tab, group]) => (
        <button
          key={tab}
          onClick={() => setTabName(tab)}
          className={`-mb-px border-b-2 px-[min(0.75rem,1%)] pb-1 whitespace-nowrap ${group === shown ? "border-primary text-primary" : "border-transparent text-subtle-foreground hover:border-white/40 hover:text-strong-foreground"}`}
        >
          {tab}{" "}
          <span className="text-faint-foreground">
            {group.reduce((n, table) => n + table.rows.length, 0)}
          </span>
        </button>
      ))}
    </div>
  );
  const tableOf = (table: Table, heading: ReactNode) => (
    <DataTable
      table={table}
      flush
      heading={heading}
      selectedRowId={selection?.row.id}
      onSelect={(rowId) =>
        onSelect({
          table,
          row: table.rows.find((r) => r.id === rowId)!,
        })
      }
    />
  );
  return (
    <CollapsibleSection
      section={section}
      count={tables.reduce((n, table) => n + table.rows.length, 0)}
      open={open}
      onToggle={onToggle}
    >
      {shown.length === 1 ? (
        tableOf(shown[0]!, tabBar)
      ) : (
        <>
          {tabBar && <div className="flex items-end pb-1">{tabBar}</div>}
          <div className="grid gap-4 pb-1 sm:grid-cols-2">
            {shown.map((table) => (
              <div key={table.id} className="min-w-0">
                {tableOf(
                  table,
                  table.label && (
                    <TableLabel>{t(`tables.${table.label}`)}</TableLabel>
                  ),
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </CollapsibleSection>
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
