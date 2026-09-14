import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isUnresolved, type Cell, type Table } from "../save/view";

/** Formats cells for the current language. */
export function useFormatCell() {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const number = new Intl.NumberFormat(i18n.language);
    const yes = t("table.yes");
    const no = t("table.no");
    return (cell: Cell) =>
      cell === undefined
        ? "—"
        : typeof cell === "boolean"
          ? cell
            ? yes
            : no
          : typeof cell === "number"
            ? number.format(cell)
            : cell;
  }, [t, i18n.language]);
}

export function DataTable({
  table,
  selectedRowId,
  onSelect,
}: {
  table: Table;
  selectedRowId: string | undefined;
  onSelect: (rowId: string) => void;
}) {
  const { t } = useTranslation();
  const formatCell = useFormatCell();
  if (!table.rows.length)
    return <p className="py-2 text-faint-foreground">{t("table.empty")}</p>;
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full">
        <thead>
          <tr className="text-left text-subtle-foreground">
            {table.columns.map((column) => (
              <th
                key={column}
                className="px-3 py-1 font-normal whitespace-nowrap"
              >
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.id)}
              className={`cursor-pointer ${row.id === selectedRowId ? "bg-selection text-strong-foreground" : "odd:bg-stripe hover:bg-accent hover:text-accent-foreground"}`}
            >
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`px-3 py-0.5 whitespace-nowrap ${isUnresolved(cell) ? "text-faint-foreground" : ""} ${typeof cell === "number" ? "text-right tabular-nums" : ""}`}
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
