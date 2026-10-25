import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import type { EntityRange } from "../../core/unit-store";
import type { UnitEntity } from "../../core/save-data-binary";
import { CHARACTER_KEYS } from "../../data/characters";

export const CHARACTERS = keyTable("chara", CHARACTER_KEYS);

export const CHARACTER_FIRST = 10000;

export const CHARACTER_MAX_LEVEL = 100;
export const CHARACTER_MAX_XP = 8_400_000;

/** Over Masteries, mastery nodes and master trait cells. */
export const MASTERY_FIRST = 10000000;
export const MASTERY_ENTRIES = 400;

export const CHARACTER_KEY = keyAttribute(1301, CHARACTERS);
export const CHARACTER_XP = Attribute.int(1303);
export const CHARACTER_FLAGS = Attribute.rawFlags(1305);
export const CHARACTER_JOINED = 1;

export const CHARACTER_LEVEL = Attribute.int(1308);
export const CHARACTER_BASE_HP = Attribute.int(1309);
export const CHARACTER_BASE_ATTACK = Attribute.int(1310);
export const CHARACTER_QUESTS_USED = Attribute.uint(1314);
/** The character this one plays as in a story party. */
export const CHARACTER_STAND_IN = keyAttribute(1315, CHARACTERS);
export const CHARACTER_MASTER_XP = Attribute.int(1323);
/** New marks of two menus, 0 once viewed. */
export const CHARACTER_MASTER_BREAK_MARKS = Attribute.intList(1504);
/** New mark of a master level cap break. */
export const CHARACTER_MASTER_BREAK_NEW = 0x2000;

export const masteryRange = (gear: UnitEntity): EntityRange => ({
  first: MASTERY_FIRST + (gear - CHARACTER_FIRST) * 1000,
  count: MASTERY_ENTRIES,
});
