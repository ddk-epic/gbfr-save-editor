import { Attribute, keyAttribute, keyTable } from "@gbfr/core";
import { SUMMON_BASE_PARAM_KEYS, SUMMON_KEYS } from "./data.gen";

export const SUMMONS = keyTable("summon", SUMMON_KEYS);
export const SUMMON_BASE_PARAMS = keyTable(
  "summon_base_param",
  SUMMON_BASE_PARAM_KEYS,
);

export const SUMMON_FIRST = 0;

/** Summon ids at entity 0. Chosen party wide, so the same four apply to every character. */
export const SUMMONS_EQUIPPED = Attribute.uintList(1451);
export const SUMMON_POSITIONS = 4;
/** `summon.Key` per row, at entities 0-299. */
export const SUMMONS_KEY = Attribute.uint(1452);
/** 1 beside a `SUMMONS_KEY` row once obtained. */
export const SUMMONS_OBTAINED = Attribute.uint(1453);
export const SUMMON_LAST_ID = Attribute.uint(1454);
/** 1 once the save has summons. */
export const SUMMONS_UNLOCKED = Attribute.uint(1455);
export const SUMMON_LIST_ENTRIES = 1000;

export const SUMMON_ID = Attribute.uint(1456);
export const SUMMON_KEY = keyAttribute(1457, SUMMONS);
export const SUMMON_TRAIT_AND_BONUS = Attribute.uintList(1458);
export const SUMMON_LEVELS = Attribute.intList(1459);
export const SUMMON_FLAGS = Attribute.flags(1460, {
  everEquipped: 1,
  seen: 2,
});
