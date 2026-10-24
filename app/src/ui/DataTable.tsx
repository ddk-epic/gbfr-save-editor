import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../i18n/game-text";
import type { ColumnId, Row, Table } from "../view/types";
import { cellKeys, useRenderCell } from "./render-cell";

/** Narrowest share of a column's width. */
const SHRINK_FACTOR = 0.5;

const ROW_BATCH = 200;
const VISIBLE_ROWS = 20;

const TABLE_MAX_HEIGHT = `calc(${VISIBLE_ROWS} * 1.5em + ${VISIBLE_ROWS} * 0.25rem)`;

/** Heading, gap and column header: 3 rows. */
export const HEADING_HEIGHT = "calc(3em + 0.25rem - 2px)";

/** Horizontal cell padding, both sides. */
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
  const gt = useGameText();
  const [shown, setShown] = useState({ tableId: table.id, limit: ROW_BATCH });
  const selectedIndex = table.rows.findIndex((r) => r.id === selectedRowId);
  const limit = Math.max(
    shown.tableId === table.id ? shown.limit : ROW_BATCH,
    selectedIndex + 1,
  );
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

  // Pads the header for the body's vertical scrollbar.
  const header = useRef<HTMLDivElement>(null);
  const rowGroup = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      if (header.current)
        header.current.style.paddingRight = `${el.offsetWidth - el.clientWidth}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (rowGroup.current) observer.observe(rowGroup.current);
    return () => observer.disconnect();
  }, [table.rows.length]);
  const layout = useMemo(() => columnLayout(table), [table]);

  useEffect(() => {
    if (selectedIndex >= 0)
      rowGroup.current?.children[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
  }, [selectedIndex]);
  const label = (column: ColumnId) =>
    t(`columns.${column}`, { trait: gt("ui", "trait") });

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
            <TableRow
              key={row.id}
              row={row}
              layout={layout}
              selected={row.id === selectedRowId}
              onSelect={onSelect}
            />
          ))}
        </div>
        {hasMore && <div ref={sentinel} className="h-px" />}
      </div>
    </div>
  );
}

const TableRow = memo(function TableRow({
  row,
  layout,
  selected,
  onSelect,
}: {
  row: Row;
  layout: CSSProperties;
  selected: boolean;
  onSelect: (rowId: string) => void;
}) {
  const renderCell = useRenderCell();
  return (
    <div
      role="row"
      onClick={() => onSelect(row.id)}
      style={layout}
      className={`grid cursor-pointer ${selected ? "bg-selection text-strong-foreground" : "even:bg-card hover:bg-accent hover:text-accent-foreground"}`}
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
  );
});
