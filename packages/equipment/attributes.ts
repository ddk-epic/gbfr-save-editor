import { Attribute, keyAttribute } from "@gbfr/core";
import { CHARACTERS } from "@gbfr/tables";

export const LOADOUT_FIRST = 20000;
export const LOADOUT_COUNT = 615;

export const EQUIP_WEAPON = Attribute.uint(1402);
export const EQUIP_SIGILS = Attribute.uintList(1403);
export const EQUIP_SIGIL_SLOTS = 12;

export const LOADOUT_NAME = Attribute.text(3002, "byte");
/** The character a loadout belongs to. */
export const EQUIP_CHARACTER = keyAttribute(3003, CHARACTERS);
