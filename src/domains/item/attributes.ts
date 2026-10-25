import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { ITEMS } from "../wrightstone/attributes";

export const ITEM_KEY = keyAttribute(1801, ITEMS);
export const ITEM_COUNT = Attribute.int(1802);
export const ITEM_FLAG_BITS = {
  wishList: 1,
  fieldNote: 4,
  seen: 8,
  keyItem: 32,
} as const;
export const ITEM_FLAGS = Attribute.flags(1803, ITEM_FLAG_BITS);
/** The acquisition counter's value when the item was last gained. */
export const ITEM_ACQUIRED = Attribute.uint(1804);
/** The acquisition counter, at entity 0. */
export const ITEM_ACQUIRED_LAST = Attribute.uint(1805);
/** Bits that add item menu tabs, at entity 0. */
export const INVENTORY_TABS = Attribute.rawFlags(1806);
