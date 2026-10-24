import { Fragment, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useGameText } from "../i18n/game-text";
import { keyCells } from "../view/cell";
import type { Cell } from "../view/types";

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
