import { useTranslation } from "react-i18next";
import type { Selection } from "../navigation";
import type { EquipmentSetView, Table } from "../save/view";
import { DataTable, HEADING_HEIGHT, TableLabel } from "./DataTable";

/** The equipped set, then each loadout: skills and sigils left, weapon and wrightstone right. */
export function EquipmentSets({
  sets,
  selection,
  onSelect,
}: {
  sets: EquipmentSetView[];
  selection: Selection | undefined;
  onSelect: (selection: Selection) => void;
}) {
  const { t } = useTranslation();
  const tableOf = (label: string, table: Table) => (
    <DataTable
      table={table}
      heading={<TableLabel>{label}</TableLabel>}
      selectedRowId={selection?.row.id}
      onSelect={(rowId) =>
        onSelect({ table, row: table.rows.find((r) => r.id === rowId)! })
      }
    />
  );
  return (
    <div className="space-y-4 pb-3">
      {sets.map((set) => (
        <div key={set.id}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <div
                    className="flex items-end pb-1"
                    style={{ height: HEADING_HEIGHT }}
                  >
                    <TableLabel>{t("equipment.loadout")}</TableLabel>
                  </div>
                  <h3 className="text-strong-foreground">
                    {set.name ?? t("equipment.equipped")}
                  </h3>
                </div>
                <div className="min-w-0">
                  {tableOf(t("equipment.skills"), set.skills)}
                </div>
              </div>
              {tableOf(t("equipment.sigils"), set.sigils)}
            </div>
            <div className="min-w-0">
              {tableOf(t("equipment.weapon"), set.weapon)}
              {tableOf(t("equipment.wrightstone"), set.wrightstone)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
