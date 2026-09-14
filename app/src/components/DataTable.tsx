import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isUnresolved, type Cell, type Table } from "../save/view";

const ROW_BATCH = 200;
const VISIBLE_ROWS = 25;

const TABLE_MAX_HEIGHT = `calc(${VISIBLE_ROWS + 1} * 1.5em + ${VISIBLE_ROWS} * 0.25rem + 0.5rem)`;

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
  const [shown, setShown] = useState({ tableId: table.id, limit: ROW_BATCH });
  const limit = shown.tableId === table.id ? shown.limit : ROW_BATCH;
  const hasMore = table.rows.length > limit;
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // Sentinel re-created after each batch.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setShown({ tableId: table.id, limit: limit + ROW_BATCH });
      },
      { root: scroller.current, rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [table.id, limit, hasMore]);

  if (!table.rows.length)
    return <p className="py-2 text-faint-foreground">{t("table.empty")}</p>;
  return (
    <div
      ref={scroller}
      className="mb-2 overflow-auto"
      style={{ maxHeight: TABLE_MAX_HEIGHT }}
    >
      <table className="w-full">
        <thead className="sticky top-0 bg-background">
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
          {table.rows.slice(0, limit).map((row) => (
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
      {hasMore && <div ref={sentinel} className="h-px" />}
    </div>
  );
}
