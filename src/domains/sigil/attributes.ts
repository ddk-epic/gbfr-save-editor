import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { GEM_KEYS } from "../../data/sigils";

export const GEMS = keyTable("gem", GEM_KEYS);

export const SIGIL_FIRST = 30000;

export const SIGIL_ID = Attribute.uint(2702);
export const SIGIL_KEY = keyAttribute(2703, GEMS);
export const SIGIL_LEVEL = Attribute.int(2704);
export const SIGIL_FLAGS = Attribute.flags(2707, { locked: 1, seen: 2 });

export const SIGIL_POSITIONS = 12;
