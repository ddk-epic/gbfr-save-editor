import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { ITEMS } from "../../tables/items";

export const WRIGHTSTONE_FIRST = 50000;

export const WRIGHTSTONE_LAST_ID = Attribute.uint(2101);
export const WRIGHTSTONE_KEY = keyAttribute(2102, ITEMS);
export const WRIGHTSTONE_ID = Attribute.uint(2103);
export const WRIGHTSTONE_LOCKED = Attribute.bool(2104);
export const WRIGHTSTONE_FLAGS = Attribute.flags(2105, { seen: 2 });
