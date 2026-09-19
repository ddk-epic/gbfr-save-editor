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
import {
  SHRINK_FACTOR,
  keyCells,
  type Cell,
  type ColumnId,
  type Table,
} from "../save/view";

const ROW_BATCH = 200;
const VISIBLE_ROWS = 20;

const TABLE_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * 1.5em + ${VISIBLE_ROWS} * 0.25rem)`;

/**
 * Heading, gap and column header span exactly 3 rows (row 1.5em + 0.25rem,
 * header 1.5em + 0.5rem + 2px border), so rows of side-by-side tables line up.
 */
export const HEADING_HEIGHT = "calc(3em + 0.25rem - 2px)";

/** Horizontal padding of a cell, both sides together. */
const CELL_PADDING = "1.5rem";

const width = (letters: number) => `calc(${letters}ch + ${CELL_PADDING})`;

/** Grid columns: letter-defined column width with a stretch column taking the remaining width. */
const columnLayout = (table: Table) => {
  const floors: number[] = [];
  const tracks = table.columns.map(([column, letters]) => {
    const floor = Math.ceil(letters * SHRINK_FACTOR);
    floors.push(floor);
    return `minmax(${width(floor)}, ${column === table.stretch ? "1fr" : width(letters)})`;
  });
  return {
    gridTemplateColumns: tracks.join(" "),
    minWidth: `calc(${floors.reduce((a, b) => a + b, 0)}ch + ${table.columns.length} * ${CELL_PADDING})`,
  };
};

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
      if ("unknown" in cell)
        return <span className="italic">{t("table.unknown")}</span>;
      const separator = "separator" in cell ? cell.separator : "";
      return keyCells(cell).map((k, i) => {
        const text = gt(k.text, k.key);
        const values = k.values;
        return (
          <Fragment key={i}>
            {i > 0 && separator}
            <span className={text === undefined ? "text-faint-foreground" : ""}>
              {text === undefined
                ? k.key
                : values
                  ? (k.text === "masteryEffect"
                      ? // <d>…<d> marks the transcendence bonus; dropped without one.
                        text.replace(/<d>(.*?)<d>/g, (_, part: string) =>
                          /\{(\d+)\}/
                            .exec(part)
                            ?.slice(1)
                            .every((n) => values[Number(n)] !== undefined)
                            ? part
                            : "",
                        )
                      : text
                    )
                      .replace(/\{(\d+)\}/g, (_, n: string) =>
                        number.format(values[Number(n)] ?? 0),
                      )
                      .replace(/\s+/g, " ")
                  : text}
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
  flush,
}: {
  table: Table;
  selectedRowId: string | undefined;
  onSelect: (rowId: string) => void;
  /** Label or tabs above the column header, in a block 3 rows tall with it; none when omitted. */
  heading?: ReactNode;
  /** The heading at its own height, for a table right under an accordion header. */
  flush?: boolean;
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

  // The header sits outside the scroller, so it matches the body's width by
  // padding for the vertical scrollbar while one shows.
  const header = useRef<HTMLDivElement>(null);
  const rowGroup = useRef<HTMLDivElement>(null);
  const [scrollbar, setScrollbar] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setScrollbar(el.offsetWidth - el.clientWidth),
    );
    observer.observe(el);
    if (rowGroup.current) observer.observe(rowGroup.current);
    return () => observer.disconnect();
  }, [table.rows.length]);
  const layout = useMemo(() => columnLayout(table), [table]);
  const label = (column: ColumnId) => t(`columns.${column}`);

  const headingBlock = heading && (
    <div
      className="flex items-end pb-1"
      style={flush ? undefined : { height: HEADING_HEIGHT }}
    >
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
    <div role="table">
      {headingBlock}
      <div
        ref={header}
        role="rowgroup"
        style={{ paddingRight: scrollbar }}
        className="relative z-10 overflow-hidden border-b-2 border-primary bg-secondary shadow-[0_2px_4px_-2px_rgb(0_0_0/0.25)]"
      >
        <div role="row" className="grid text-left" style={layout}>
          {table.columns.map(([column]) => (
            <div
              key={column}
              role="columnheader"
              title={label(column)}
              className="truncate px-3 py-1 font-bold text-strong-foreground"
            >
              {label(column)}
            </div>
          ))}
        </div>
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
        <div ref={rowGroup} role="rowgroup">
          {table.rows.slice(0, limit).map((row) => (
            <div
              key={row.id}
              role="row"
              onClick={() => onSelect(row.id)}
              style={layout}
              className={`grid cursor-pointer ${row.id === selectedRowId ? "bg-selection text-strong-foreground" : "even:bg-card hover:bg-accent hover:text-accent-foreground"}`}
            >
              {row.cells.map((cell, i) => (
                <div
                  key={i}
                  role="cell"
                  title={cellKeys(cell)}
                  className={`truncate px-3 py-0.5 ${typeof cell === "number" ? "text-right tabular-nums" : ""}`}
                >
                  {renderCell(cell)}
                </div>
              ))}
            </div>
          ))}
        </div>
        {hasMore && <div ref={sentinel} className="h-px" />}
      </div>
    </div>
  );
}
