import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { CHARACTERS } from "../character/attributes";

export const LOADOUT_FIRST = 20000;
export const LOADOUT_COUNT = 615;

export const EQUIP_WEAPON = Attribute.uint(1402);
export const EQUIP_SIGILS = Attribute.uintList(1403);
export const EQUIP_SKILLS = Attribute.uintList(1404);

export const LOADOUT_NAME = Attribute.text(3002, "byte");
/** The character a loadout belongs to. Live gear names it with CHARACTER_KEY. */
export const EQUIP_CHARACTER = keyAttribute(3003, CHARACTERS);
