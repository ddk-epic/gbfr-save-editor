import { useWatched, Watched } from "./watched";

const DEFAULT_OPEN = ["profile", "party", "equippedSummons", "stats", "gear"];

/** Open sections by section id, shared by the save and every character. */
const open = new Watched<ReadonlySet<string>>(new Set(DEFAULT_OPEN));

export const useSectionOpen = (section: string) =>
  useWatched(open, (o) => o.has(section));

export function toggleSection(section: string) {
  const next = new Set(open.get());
  if (!next.delete(section)) next.add(section);
  open.set(next);
}

export const openSections = (sections: string[]) =>
  open.set(new Set([...open.get(), ...sections]));

export const closeSections = (sections: string[]) =>
  open.set(new Set([...open.get()].filter((s) => !sections.includes(s))));

export const resetSections = () => open.set(new Set(DEFAULT_OPEN));
