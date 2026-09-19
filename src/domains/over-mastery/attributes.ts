import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { LIMIT_BONUS_PARAM_KEYS } from "../../data/masteries";

export const LIMIT_BONUS_PARAMS = keyTable(
  "limit_bonus_param",
  LIMIT_BONUS_PARAM_KEYS,
);

/** Over-mastery lines, on the first entities of a character's mastery block. */
export const OVER_MASTERY_LINES = 4;

export const OVER_MASTERY_KEY = keyAttribute(1606, LIMIT_BONUS_PARAMS);
export const OVER_MASTERY_LEVEL = Attribute.int(1607);
