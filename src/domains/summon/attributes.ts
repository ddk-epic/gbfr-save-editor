import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { SUMMON_BASE_PARAM_KEYS, SUMMON_KEYS } from "../../data/summons";

export const SUMMONS = keyTable("summon", SUMMON_KEYS);
export const SUMMON_BASE_PARAMS = keyTable(
  "summon_base_param",
  SUMMON_BASE_PARAM_KEYS,
);

export const SUMMON_FIRST = 0;

/** Summon ids at entity 0. Chosen party wide, so the same four apply to every character. */
export const SUMMONS_EQUIPPED = Attribute.uintList(1451);
export const SUMMON_POSITIONS = 4;

export const SUMMON_ID = Attribute.uint(1456);
export const SUMMON_KEY = keyAttribute(1457, SUMMONS);
export const SUMMON_TRAIT_AND_BONUS = Attribute.uintList(1458);
export const SUMMON_LEVELS = Attribute.intList(1459);
export const SUMMON_FLAGS = Attribute.flags(1460, {
  everEquipped: 1,
  seen: 2,
});
