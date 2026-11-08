import { Attribute, keyAttribute } from "@gbfr/core";
import { GEMS } from "@gbfr/tables";

export const SIGIL_FIRST = 30000;

export const SIGIL_LAST_ID = Attribute.uint(2701);
export const SIGIL_ID = Attribute.uint(2702);
export const SIGIL_KEY = keyAttribute(2703, GEMS);
export const SIGIL_LEVEL = Attribute.int(2704);
export const SIGIL_FLAGS = Attribute.flags(2707, { locked: 1, seen: 2 });
export const SIGIL_LIST_FLAGS = Attribute.flags(2708, { added: 1 });
