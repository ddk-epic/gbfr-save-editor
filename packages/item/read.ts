import { ITEM_SORT_ORDER } from "./data.gen";
import { hashOfKey, type Save, type Units } from "@gbfr/core";
import { ITEMS } from "@gbfr/tables";
import { ITEM_COUNT, ITEM_FLAGS, ITEM_KEY } from "./attributes";

/** item.SortOrder, the inventory's item order; unresolved keys last. */
export const itemOrder = (key: string) => ITEM_SORT_ORDER[key] ?? Infinity;

/** `item.Key` hash, hex keys included. */
export const itemHash = (key: string) => hashOfKey(ITEMS, key);

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
export function readItems(units: Units): Map<string, number> {
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
  units: Units,
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

export const TREASURE_CAP = 999;
const KNICKKNACK_VOUCHER_CAP = 99999;
const KNICKKNACK_VOUCHER = "ITEM_21_0000";
const CURIO_PREFIX = "ITEM_19_";
const CARD_PREFIX = "ITEM_23_";
const PLAIN_CARD = "ITEM_23_0000";
const PLAIN_CARD_COUNT = 99;
const CHARACTER_CARD_COUNT = 1;

function treasureTarget(key: string): number | undefined {
  if (itemTab(key) !== "treasures" || key.startsWith(CURIO_PREFIX))
    return undefined;
  if (key === KNICKKNACK_VOUCHER) return KNICKKNACK_VOUCHER_CAP;
  if (key === PLAIN_CARD) return PLAIN_CARD_COUNT;
  if (key.startsWith(CARD_PREFIX)) return CHARACTER_CARD_COUNT;
  return TREASURE_CAP;
}

export function treasuresBelowTarget(units: Units) {
  return units.entitiesWith(ITEM_KEY).flatMap((entity) => {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    const target = key === undefined ? undefined : treasureTarget(key);
    return target !== undefined && at.get(ITEM_COUNT) < target
      ? [{ entity, target }]
      : [];
  });
}

/** True on a save with a treasure below its target count. */
export const canMaxTreasures = (save: Save) =>
  treasuresBelowTarget(save.slotData.units).length > 0;
