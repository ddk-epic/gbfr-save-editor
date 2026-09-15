import {
  Fragment,
  useCallback,
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

const TABLE_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * 1.5em + ${VISIBLE_ROWS} * 0.25rem)`;

/**
 * Heading, gap and column header span exactly 3 rows (row 1.5em + 0.25rem,
 * header 1.5em + 0.5rem + 2px border), so rows of side-by-side tables line up.
 */
export const HEADING_HEIGHT = "calc(3em + 0.25rem - 2px)";

/** A small uppercase label for a table heading. */
export const TableLabel = ({ children }: { children: string }) => (
  <span className="text-[12px] tracking-widest text-subtle-foreground uppercase">
    {children}
  </span>
);

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
  heading,
}: {
  table: Table;
  selectedRowId: string | undefined;
  onSelect: (rowId: string) => void;
  /** Label or tabs above the column header, in a block 3 rows tall with it; none when omitted. */
  heading?: ReactNode;
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

  // The header lives outside the scroller so the scrollbar stops at the body;
  // its cols copy the widths of a hidden header row inside the body table.
  const header = useRef<HTMLDivElement>(null);
  const headerTable = useRef<HTMLTableElement>(null);
  const syncWidths = useCallback((row: HTMLTableRowElement) => {
    const observer = new ResizeObserver(() => {
      const target = headerTable.current;
      if (!target) return;
      const cols = target.querySelectorAll("col");
      let total = 0;
      [...row.cells].forEach((cell, i) => {
        const width = cell.getBoundingClientRect().width;
        total += width;
        if (cols[i]) cols[i].style.width = `${width}px`;
      });
      target.style.width = `${total}px`;
    });
    for (const cell of row.cells) observer.observe(cell);
    return () => observer.disconnect();
  }, []);

  const headingBlock = heading && (
    <div className="flex items-end pb-1" style={{ height: HEADING_HEIGHT }}>
      {heading}
    </div>
  );
  if (!table.rows.length)
    return (
      <>
        {headingBlock}
        <p className="py-0.5 text-faint-foreground">{t("table.empty")}</p>
      </>
    );
  return (
    <div>
      {headingBlock}
      <div
        ref={header}
        className="relative z-10 overflow-hidden border-b-2 border-primary bg-secondary shadow-[0_2px_4px_-2px_rgb(0_0_0/0.25)]"
      >
        <table
          ref={headerTable}
          className="table-fixed border-separate border-spacing-0"
        >
          <colgroup>
            {table.columns.map((column) => (
              <col key={column} />
            ))}
          </colgroup>
          <thead>
            <tr className="text-left">
              {table.columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-1 font-bold whitespace-nowrap text-strong-foreground"
                >
                  {t(`columns.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
      <div
        ref={scroller}
        className="overflow-auto bg-card/50"
        style={{ maxHeight: TABLE_MAX_HEIGHT }}
        onScroll={(e) => {
          if (header.current)
            header.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        <table className="w-full border-separate border-spacing-0">
          <thead aria-hidden>
            {/* Keyed by table so a new column set gets a fresh observer. */}
            <tr key={table.id} ref={syncWidths}>
              {table.columns.map((column) => (
                <th
                  key={column}
                  className="invisible h-0 px-3 py-0 font-bold leading-[0] whitespace-nowrap"
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
                className={`cursor-pointer ${row.id === selectedRowId ? "bg-selection text-strong-foreground" : "even:bg-card hover:bg-accent hover:text-accent-foreground"}`}
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
    </div>
  );
}
