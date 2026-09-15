import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sectionId, type Selection } from "../navigation";
import type { SectionId, Table } from "../save/view";
import { DataTable } from "./DataTable";

/** Tables as sections that open and close by their header; tables sharing a section are its tabs. */
export function CollapsibleTables({
  tables,
  isOpen,
  onToggle,
  selection,
  onSelect,
}: {
  tables: Table[];
  isOpen: (section: SectionId) => boolean;
  onToggle: (section: SectionId) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
}) {
  const sections = new Map<SectionId, Table[]>();
  for (const table of tables)
    sections.set(table.section, [
      ...(sections.get(table.section) ?? []),
      table,
    ]);
  return (
    <div className="divide-y divide-border border-b border-border">
      {[...sections].map(([section, tabs]) => (
        <Section
          key={section}
          section={section}
          tabs={tabs}
          open={isOpen(section)}
          onToggle={() => onToggle(section)}
          selection={selection}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function Section({
  section,
  tabs,
  open,
  onToggle,
  selection,
  onSelect,
}: {
  section: SectionId;
  tabs: Table[];
  open: boolean;
  onToggle: () => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
}) {
  const { t } = useTranslation();
  const [tabId, setTabId] = useState(tabs[0]!.id);
  const table = tabs.find((tab) => tab.id === tabId) ?? tabs[0]!;
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
        <span className="text-faint-foreground">
          {tabs.reduce((n, tab) => n + tab.rows.length, 0)}
        </span>
      </button>
      {open && tabs.length > 1 && (
        <div className="mb-1 flex gap-4 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabId(tab.id)}
              className={`-mb-px border-b-2 pb-1 ${tab.id === table.id ? "border-primary text-primary" : "border-transparent text-subtle-foreground hover:text-strong-foreground"}`}
            >
              {tab.tab}{" "}
              <span className="text-faint-foreground">{tab.rows.length}</span>
            </button>
          ))}
        </div>
      )}
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
