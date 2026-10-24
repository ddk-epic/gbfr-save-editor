import type { SectionId } from "../view";
import { openSections } from "./sections";
import { clearSelection } from "./selection";
import { useWatched, Watched } from "./watched";

export type Page = "welcome" | "save" | "characters" | `char:${string}`;

const page = new Watched<Page>("welcome");
// Scroll position by page, cleared per save.
const scrollTops = new Map<Page, number>();

export const usePage = () => useWatched(page);

const pageScroll = () =>
  document.querySelector<HTMLElement>("[data-page-scroll]");

export const savedScrollTop = (of: Page) => scrollTops.get(of) ?? 0;

export function go(next: Page) {
  // Leaving a page clears its selection.
  if (next !== page.get()) clearSelection();
  scrollTops.set(page.get(), pageScroll()?.scrollTop ?? 0);
  page.set(next);
}

/** Shows `next` with every page's scroll position forgotten. */
export function startAt(next: Page) {
  scrollTops.clear();
  page.set(next);
}

export function goToSection(next: Page, section: SectionId) {
  openSections([section]);
  go(next);
  scrollToSection(section);
}

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

export const scrollPageTop = () => pageScroll()?.scrollTo({ top: 0 });
