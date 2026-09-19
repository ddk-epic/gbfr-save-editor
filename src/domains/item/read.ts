import { ITEM_SORT_ORDER } from "../../data/items";
import type { UnitStore } from "../../core/unit-store";
import { ITEM_COUNT, ITEM_FLAGS, ITEM_KEY } from "./attributes";

/** item.SortOrder, the inventory's item order; unresolved keys last. */
export const itemOrder = (key: string) => ITEM_SORT_ORDER[key] ?? Infinity;

/** Tabs of the item menu. Sigils, weapons, wrightstones, summons and curios have their own menus. */
export const ITEM_TABS = ["treasures", "keyItems"] as const;
export type ItemTab = (typeof ITEM_TABS)[number];

/** The item menu tab listing an item, by item.SortOrder */
export function itemTab(key: string): ItemTab | undefined {
  const order = ITEM_SORT_ORDER[key];
  if (order === undefined) return undefined;
  if (order >= 100 && order <= 922) return "treasures";
  if (order >= 2000 && order < 3000) return "keyItems";
  return undefined;
}

/** Count by item.Key. Wrightstones are listed apart. */
export function readItems(units: UnitStore): Map<string, number> {
  const items = new Map<string, number>();
  for (const entity of units.entitiesWith(ITEM_KEY)) {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    if (key === undefined) continue;
    items.set(key, at.get(ITEM_COUNT));
  }
  return items;
}

/** item.Key of the items whose ITEM_FLAGS match. */
export function readItemsFlagged(
  units: UnitStore,
  match: (
    flags: { wishList: boolean; fieldNote: boolean; seen: boolean },
    count: number,
  ) => boolean,
): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(ITEM_KEY)) {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    if (key !== undefined && match(at.get(ITEM_FLAGS), at.get(ITEM_COUNT)))
      keys.push(key);
  }
  return keys;
}
