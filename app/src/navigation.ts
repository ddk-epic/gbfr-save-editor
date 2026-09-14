import type { Row, Table } from "./save/view";

export type Page = "welcome" | "account" | `char:${string}`;

export const sectionId = (tableId: string) => `section-${tableId}`;

export function scrollToSection(tableId: string) {
  requestAnimationFrame(() => {
    document.getElementById(sectionId(tableId))?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export interface Selection {
  table: Table;
  row: Row;
}
