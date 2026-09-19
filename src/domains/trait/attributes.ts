import { keyAttribute, keyTable } from "../../core/keys";
import type { EntityRange } from "../../core/unit-store";
import { Attribute } from "../../core/attribute";
import { SKILL_KEYS } from "../../data/sigils";

export const SKILLS = keyTable("skill", SKILL_KEYS);

export const TRAIT_KEY = keyAttribute(1701, SKILLS);
export const TRAIT_LEVEL = Attribute.int(1702);

/**
 * Trait lists sit at TRAIT_FIRST + holder * TRAIT_STRIDE + index, where the
 * holder counts from its own range: sigils from 0, weapons from TRAIT_WEAPON,
 * wrightstones from TRAIT_WRIGHTSTONE.
 */
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
