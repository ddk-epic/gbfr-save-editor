import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import type { EntityRange } from "../../core/unit-store";
import type { UnitEntity } from "../../core/save-data-binary";
import { CHARACTER_KEYS } from "../../data/characters";

export const CHARACTERS = keyTable("chara", CHARACTER_KEYS);

export const CHARACTER_FIRST = 10000;

/**
 * The mastery block holds over-masteries, mastery nodes and master trait
 * cells. Level, experience and base stats sit on the character's own entity.
 */
export const MASTERY_FIRST = 10000000;
export const MASTERY_ENTRIES = 400;

export const CHARACTER_KEY = keyAttribute(1301, CHARACTERS);
export const CHARACTER_XP = Attribute.int(1303);
export const CHARACTER_LEVEL = Attribute.int(1308);
export const CHARACTER_BASE_HP = Attribute.int(1309);
export const CHARACTER_BASE_ATTACK = Attribute.int(1310);
export const CHARACTER_QUESTS_USED = Attribute.uint(1314);
export const CHARACTER_MASTER_XP = Attribute.int(1323);

export const masteryRange = (gear: UnitEntity): EntityRange => ({
  first: MASTERY_FIRST + (gear - CHARACTER_FIRST) * 1000,
  count: MASTERY_ENTRIES,
});
