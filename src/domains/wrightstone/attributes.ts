import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { ITEM_KEYS } from "../../data/items";

export const ITEMS = keyTable("item", ITEM_KEYS);

export const WRIGHTSTONE_FIRST = 50000;

export const WRIGHTSTONE_KEY = keyAttribute(2102, ITEMS);
export const WRIGHTSTONE_ID = Attribute.uint(2103);
export const WRIGHTSTONE_LOCKED = Attribute.bool(2104);
export const WRIGHTSTONE_FLAGS = Attribute.flags(2105, { seen: 2 });
