import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { CHARACTERS } from "../character/attributes";

export const PARTY_FIRST = 103000;
export const PARTY_POSITIONS = 4;

export const PARTY_CHARACTER = keyAttribute(2201, CHARACTERS);
/** The story fixes the slot's character. */
export const PARTY_SLOT_LOCKED = Attribute.bool(2202);
/** The story requires the slot's character in the party. */
export const PARTY_SLOT_REQUIRED = Attribute.bool(2203);

/** The player's party is set aside for a story party. */
export const PARTY_KEPT = Attribute.bool(2401);
export const PARTY_KEPT_ENTITY = 10400;

/** Saved party sets, in the equipment shape. */
export const PARTY_SET_FIRST = 105000;
export const PARTY_SET_COUNT = 30;
export const PARTY_SET_STRIDE = 10;
