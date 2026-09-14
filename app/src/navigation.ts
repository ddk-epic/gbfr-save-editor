import type { Row, Table } from "./save/view";

export type Page = "welcome" | "account" | `char:${string}`;

export const sectionId = (section: string) => `section-${section}`;

export function scrollToSection(section: string) {
  requestAnimationFrame(() => {
    document
      .getElementById(sectionId(section))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export interface Selection {
  table: Table;
  row: Row;
}
