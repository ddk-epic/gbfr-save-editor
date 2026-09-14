import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cellKeys, useRenderCell } from "./DataTable";
import type { Row, Table } from "../save/view";

/** The edit panel above the tables. */
export function RowPanel({
  selected,
}: {
  selected: { table: Table; row: Row } | undefined;
}) {
  const { t } = useTranslation();
  const renderCell = useRenderCell();
  return (
    <div className="min-h-[112px] rounded-sm border border-border bg-card p-3 text-card-foreground">
      {selected ? (
        <>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[12px] tracking-widest text-subtle-foreground uppercase">
              {t("rowPanel.row")}
            </span>
            <span className="text-strong-foreground">
              {renderCell(selected.row.cells[1] ?? selected.row.cells[0])}
            </span>
            <span className="rounded-sm bg-secondary px-1.5 text-secondary-foreground">
              {t(`sections.${selected.table.section}`)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {selected.table.columns.map((column, i) => {
              const cell = selected.row.cells[i];
              const keys = cellKeys(cell);
              return (
                <div key={column} className="flex flex-col gap-1 text-[14px]">
                  <span className="text-[13px] tracking-wide text-subtle-foreground uppercase">
                    {t(`columns.${column}`)}
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Lock size={12} className="text-faint-foreground" />{" "}
                    {renderCell(cell)}
                  </span>
                  {keys && (
                    <span className="text-[13px] text-faint-foreground">
                      {keys}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-faint-foreground">{t("rowPanel.readOnly")}</p>
        </>
      ) : (
        <p className="pt-8 text-center text-faint-foreground">
          {t("rowPanel.empty")}
        </p>
      )}
    </div>
  );
}
