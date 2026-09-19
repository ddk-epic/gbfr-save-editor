import type { Row, Table } from "./save/view";

export type Page = "welcome" | "save" | "characters" | `char:${string}`;

export const sectionId = (section: string) => `section-${section}`;

export function scrollToSection(section: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(sectionId(section));
    if (!el) return;
    const top = document.querySelector<HTMLElement>("[data-page-top]");
    el.style.scrollMarginTop = `${top?.offsetHeight ?? 0}px`;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function scrollPageTop() {
  document
    .querySelector<HTMLElement>("[data-page-scroll]")
    ?.scrollTo({ top: 0 });
}

export interface Selection {
  table: Table;
  row: Row;
}
