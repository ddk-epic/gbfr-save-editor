import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../game-text";
import { keyCells, type Cell, type Table } from "../save/view";

const ROW_BATCH = 200;
const VISIBLE_ROWS = 25;

const TABLE_MAX_HEIGHT = `calc(${VISIBLE_ROWS + 1} * 1.5em + ${VISIBLE_ROWS} * 0.25rem + 0.5rem)`;

/** Renders cells for the current language: key cells by game text, the raw key faint when it has none. */
export function useRenderCell() {
  const { t, i18n } = useTranslation();
  const gt = useGameText();
  return useMemo(() => {
    const number = new Intl.NumberFormat(i18n.language);
    const yes = t("table.yes");
    const no = t("table.no");
    return (cell: Cell): ReactNode => {
      if (cell === undefined) return "—";
      if (typeof cell === "boolean") return cell ? yes : no;
      if (typeof cell === "number") return number.format(cell);
      if (typeof cell === "string") return cell;
      const separator = "separator" in cell ? cell.separator : "";
      return keyCells(cell).map((k, i) => {
        const text = gt(k.text, k.key);
        return (
          <Fragment key={i}>
            {i > 0 && separator}
            <span className={text === undefined ? "text-faint-foreground" : ""}>
              {text ?? k.key}
            </span>
            {k.level !== undefined && ` Lv ${k.level}`}
          </Fragment>
        );
      });
    };
  }, [t, i18n.language, gt]);
}

/** The archive keys behind a cell, for a tooltip; undefined for plain values. */
export const cellKeys = (cell: Cell) =>
  keyCells(cell)
    .map((k) => k.key)
    .join(", ") || undefined;

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
  const renderCell = useRenderCell();
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
                  title={cellKeys(cell)}
                  className={`px-3 py-0.5 whitespace-nowrap ${typeof cell === "number" ? "text-right tabular-nums" : ""}`}
                >
                  {renderCell(cell)}
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
