import { keyAttribute, type EntityRange, Attribute } from "@gbfr/core";
import { SKILLS } from "@gbfr/tables";

export const TRAIT_KEY = keyAttribute(1701, SKILLS);
export const TRAIT_LEVEL = Attribute.int(1702);

/** Trait entity: TRAIT_FIRST + holder * TRAIT_STRIDE + index, the holder counted within its range. */
export const TRAIT_FIRST = 120000000;
export const TRAIT_STRIDE = 100;
export const TRAIT_SIGIL = 0;
export const TRAIT_WEAPON = 100000;
export const TRAIT_WRIGHTSTONE = 200000;

/** The entities holding one holder's traits. */
export const traitRange = (holder: number): EntityRange => ({
  first: TRAIT_FIRST + holder * TRAIT_STRIDE,
  count: TRAIT_STRIDE,
});
