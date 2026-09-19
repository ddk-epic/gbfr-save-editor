import { keyAttribute } from "../../core/keys";
import { CHARACTERS } from "../character/attributes";

export const PARTY_FIRST = 103000;
export const PARTY_POSITIONS = 4;

export const PARTY_CHARACTER = keyAttribute(2201, CHARACTERS);

/** Set s, member m at PARTY_SET_FIRST + s * PARTY_SET_STRIDE + m, in the equipment shape. */
export const PARTY_SET_FIRST = 105000;
export const PARTY_SET_COUNT = 30;
export const PARTY_SET_STRIDE = 10;
