import { Lock, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../game-text";
import { cellKeys, useRenderCell } from "./DataTable";
import type { Row, Table } from "../save/view";

/** The edit panel above the tables. */
export function RowPanel({
  selected,
  editor,
  heading,
  onClose,
}: {
  selected: { table: Table; row: Row } | undefined;
  /** Replaces the read-only note, or with `heading` the empty text. */
  editor?: ReactNode;
  /** Header of an editor shown without a selected row. */
  heading?: { label: string; title: ReactNode; section: Table["section"] };
  /** Shows the top-right close button while the panel has content. */
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const renderCell = useRenderCell();
  const gt = useGameText();
  const close = onClose && (
    <button
      onClick={onClose}
      title={gt("ui", "close")}
      aria-label={gt("ui", "close")}
      className="ml-auto self-start rounded-sm p-0.5 text-subtle-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <X size={16} />
    </button>
  );
  const header = ({ label, title, section }: NonNullable<typeof heading>) => (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="text-[12px] tracking-widest text-subtle-foreground uppercase">
        {label}
      </span>
      <span className="text-strong-foreground">{title}</span>
      <span className="rounded-sm bg-secondary px-1.5 text-secondary-foreground">
        {t(`sections.${section}`)}
      </span>
      {close}
    </div>
  );
  return (
    <div className="min-h-[112px] rounded-sm border border-border bg-card p-3 text-card-foreground">
      {selected ? (
        <>
          {header({
            label: t("rowPanel.row"),
            title: renderCell(selected.row.cells[1] ?? selected.row.cells[0]),
            section: selected.table.section,
          })}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {selected.table.columns.map(([column], i) => {
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
          {editor ? (
            <div className="mt-3">{editor}</div>
          ) : (
            <p className="mt-2 text-faint-foreground">
              {t("rowPanel.readOnly")}
            </p>
          )}
        </>
      ) : editor && heading ? (
        <>
          {header(heading)}
          {editor}
        </>
      ) : (
        <p className="pt-8 text-center text-faint-foreground">
          {t("rowPanel.empty")}
        </p>
      )}
    </div>
  );
}
