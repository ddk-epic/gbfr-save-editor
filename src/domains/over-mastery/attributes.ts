import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { LIMIT_BONUS_PARAM_KEYS } from "../../data/over-masteries";

export const LIMIT_BONUS_PARAMS = keyTable(
  "limit_bonus_param",
  LIMIT_BONUS_PARAM_KEYS,
);

/** Over Mastery lines, on the first entities of a character's mastery block. */
export const OVER_MASTERY_LINES = 4;

export const OVER_MASTERY_KEY = keyAttribute(1606, LIMIT_BONUS_PARAMS);
export const OVER_MASTERY_LEVEL = Attribute.int(1607);

export const OVER_MASTERY_ROLLED = Attribute.boolList(5807);
export const OVER_MASTERY_LV3_ROLLED = Attribute.boolList(5808);
export const RANDOM_SEEDS = Attribute.uintList(7601);
