import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Selection } from "../navigation";
import type { EquipmentSetView, Table } from "../save/view";
import { DataTable, TableLabel } from "./DataTable";

/** The equipped set and each loadout as tabs: skills and sigils left, weapon and wrightstone right. */
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
  const [setId, setSetId] = useState(sets[0]?.id);
  const set = sets.find((s) => s.id === setId) ?? sets[0];
  if (!set) return null;
  const tableOf = (label: string, table: Table, flush = false) => (
    <DataTable
      table={table}
      heading={<TableLabel>{label}</TableLabel>}
      flush={flush}
      selectedRowId={selection?.row.id}
      onSelect={(rowId) =>
        onSelect({ table, row: table.rows.find((r) => r.id === rowId)! })
      }
    />
  );
  return (
    <div className="pb-3">
      <div className="flex items-end pb-1">
        <div className="flex w-full border-b border-border">
          {sets.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSetId(s.id)}
              className={`-mb-px border-b-2 px-[min(0.75rem,1%)] pb-1 whitespace-nowrap ${s === set ? "border-primary text-primary" : "border-transparent text-subtle-foreground hover:border-white/40 hover:text-strong-foreground"}`}
            >
              {s.partySet !== undefined
                ? t("equipment.partySet", { number: s.partySet })
                : i === 0
                  ? t("equipment.equipped")
                  : t("equipment.loadout", {
                      number: String(i).padStart(2, "0"),
                    })}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              {set.name !== undefined && (
                <>
                  <div className="flex items-end pb-1">
                    <TableLabel>{t("equipment.name")}</TableLabel>
                  </div>
                  <h3 className="text-strong-foreground">{set.name}</h3>
                </>
              )}
            </div>
            <div className="min-w-0">
              {tableOf(t("equipment.skills"), set.skills, true)}
            </div>
          </div>
          {tableOf(t("equipment.sigils"), set.sigils)}
        </div>
        <div className="min-w-0">
          {tableOf(t("equipment.weapon"), set.weapon, true)}
          {tableOf(t("equipment.wrightstone"), set.wrightstone)}
        </div>
      </div>
    </div>
  );
}
