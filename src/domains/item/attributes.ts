import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { ITEMS } from "../wrightstone/attributes";

export const ITEM_KEY = keyAttribute(1801, ITEMS);
export const ITEM_COUNT = Attribute.int(1802);
export const ITEM_FLAGS = Attribute.flags(1803, {
  wishList: 1,
  fieldNote: 4,
  seen: 8,
});
