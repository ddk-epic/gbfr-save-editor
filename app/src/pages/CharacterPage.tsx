import { useTranslation } from "react-i18next";
import {
  CollapsibleSection,
  CollapsibleTables,
  ExpandCollapseActions,
} from "../components/CollapsibleTables";
import { DataTable, TableLabel } from "../components/DataTable";
import { EquipmentSets } from "../components/EquipmentSets";
import { useGameText } from "../game-text";
import { PageTop } from "../components/PageTop";
import { RowPanel } from "../components/RowPanel";
import type { Selection } from "../navigation";
import type { CharacterView, Table } from "../save/view";

export function CharacterPage({
  fileName,
  character,
  open,
  setOpen,
  selection,
  onSelect,
  onRoot,
}: {
  fileName: string;
  character: CharacterView;
  open: Set<string>;
  setOpen: (open: Set<string>) => void;
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
  onRoot: () => void;
}) {
  const { t } = useTranslation();
  const gt = useGameText();
  const name = gt("character", character.key) ?? character.key;
  const [level, fateEpisodes] = character.tables.filter(
    (table) => table.section === "stats",
  );
  const tables = character.tables.filter((table) => table.section !== "stats");
  const sections: string[] = [
    "stats",
    ...tables.map((table) => table.section),
    "equipment",
  ];
  const toggle = (section: string) => {
    const next = new Set(open);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setOpen(next);
  };
  const tableOf = (label: string, table: Table) => (
    <DataTable
      table={table}
      heading={<TableLabel>{label}</TableLabel>}
      flush
      selectedRowId={selection?.row.id}
      onSelect={(rowId) =>
        onSelect({ table, row: table.rows.find((r) => r.id === rowId)! })
      }
    />
  );

  return (
    <>
      <PageTop
        crumbs={[fileName, t("contents.characters"), name]}
        title={name}
        onRoot={onRoot}
        actions={
          <ExpandCollapseActions
            onExpandAll={() => setOpen(new Set([...open, ...sections]))}
            onCollapseAll={() =>
              setOpen(new Set([...open].filter((s) => !sections.includes(s))))
            }
          />
        }
      >
        <RowPanel selected={selection} />
      </PageTop>
      <CollapsibleTables
        tables={tables}
        isOpen={(section) => open.has(section)}
        onToggle={toggle}
        selection={selection}
        onSelect={onSelect}
        before={
          <CollapsibleSection
            section="stats"
            count={level!.rows.length + fateEpisodes!.rows.length}
            open={open.has("stats")}
            onToggle={() => toggle("stats")}
          >
            <div className="grid gap-4 pb-1 sm:grid-cols-2">
              <div className="min-w-0">{tableOf(t("stats.level"), level!)}</div>
              <div className="min-w-0">
                {tableOf(t("stats.fateEpisodes"), fateEpisodes!)}
              </div>
            </div>
          </CollapsibleSection>
        }
      >
        <CollapsibleSection
          section="equipment"
          count={character.equipment.length}
          open={open.has("equipment")}
          onToggle={() => toggle("equipment")}
        >
          <EquipmentSets
            sets={character.equipment}
            selection={selection}
            onSelect={onSelect}
          />
        </CollapsibleSection>
      </CollapsibleTables>
    </>
  );
}
