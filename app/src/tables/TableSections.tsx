import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { scrollPageTop, sectionId } from "../state/navigation";
import {
  closeSections,
  openSections,
  toggleSection,
  useSectionOpen,
} from "../state/sections";
import { TableLabel } from "../ui/DataTable";
import type { SectionId, Table } from "../view";
import { SelectableTable } from "./SelectableTable";

/** Tables as collapsible sections; a section's tables are tabs, a tab's tables halves. */
export function TableSections({
  tables,
  menuOf,
  before,
  children,
}: {
  tables: Table[];
  /** An edit menu beside a table's label. */
  menuOf?: (table: Table) => ReactNode;
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
          menuOf={menuOf}
        />
      ))}
      {children}
    </div>
  );
}

export function CollapsibleSection({
  section,
  count,
  menu,
  children,
}: {
  section: SectionId;
  count: number;
  /** An edit menu over the right end of the header. */
  menu?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const open = useSectionOpen(section);
  return (
    <section id={sectionId(section)} className="relative">
      {open && menu && (
        <div className="absolute top-2 right-0 z-20">{menu}</div>
      )}
      <button
        onClick={() => toggleSection(section)}
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
  menuOf,
}: {
  section: SectionId;
  tables: Table[];
  menuOf?: (table: Table) => ReactNode;
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
  return (
    <CollapsibleSection
      section={section}
      count={tables.reduce((n, table) => n + table.rows.length, 0)}
      menu={shown.length === 1 && menuOf?.(shown[0]!)}
    >
      {shown.length === 1 ? (
        <SelectableTable table={shown[0]!} heading={tabBar} flush />
      ) : (
        <>
          {tabBar && <div className="flex items-end pb-1">{tabBar}</div>}
          <div className="grid gap-4 pb-1 sm:grid-cols-2">
            {shown.map((table) => (
              <div key={table.id} className="min-w-0">
                <SelectableTable
                  table={table}
                  flush
                  heading={
                    <>
                      {table.label && (
                        <TableLabel>{t(`tables.${table.label}`)}</TableLabel>
                      )}
                      {menuOf?.(table) && (
                        <div className="ml-auto">{menuOf(table)}</div>
                      )}
                    </>
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}

export function ExpandCollapseActions({ sections }: { sections: string[] }) {
  const { t } = useTranslation();
  return (
    <>
      <button
        className="text-subtle-foreground hover:text-strong-foreground"
        onClick={() => openSections(sections)}
      >
        {t("tables.expandAll")}
      </button>
      <button
        className="text-subtle-foreground hover:text-strong-foreground"
        onClick={() => {
          closeSections(sections);
          scrollPageTop();
        }}
      >
        {t("tables.collapseAll")}
      </button>
    </>
  );
}
