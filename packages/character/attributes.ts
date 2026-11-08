import {
  Attribute,
  keyAttribute,
  type EntityRange,
  type UnitEntity,
} from "@gbfr/core";
import { CHARACTERS } from "@gbfr/tables";

export const CHARACTER_FIRST = 10000;

export const CHARACTER_MAX_LEVEL = 100;
export const CHARACTER_MAX_XP = 8_400_000;

/** Over Masteries, mastery nodes and master trait cells. */
export const MASTERY_FIRST = 10000000;
export const MASTERY_ENTRIES = 400;

export const CAPTAIN = Attribute.optional<number>(1103, "int");

export const CHARACTER_KEY = keyAttribute(1301, CHARACTERS);
/** `chara_costume.SkinType`. */
export const CHARACTER_OUTFIT = Attribute.int(1302);
export const CHARACTER_XP = Attribute.int(1303);
export const CHARACTER_FLAGS = Attribute.flags(1305, {
  joined: 0x1,
  storyPlaying: 0x2,
  /** `PL1900` from its story stretch on. */
  storyPlayed: 0x8,
  masterBreakNew: 0x2000,
});

export const CHARACTER_LEVEL = Attribute.int(1308);
export const CHARACTER_BASE_HP = Attribute.int(1309);
export const CHARACTER_BASE_ATTACK = Attribute.int(1310);
export const CHARACTER_QUESTS_USED = Attribute.uint(1314);
/** One bit per `chara_costume.SkinType`. */
export const CHARACTER_OUTFITS_OWNED = Attribute.uint(1316);
export const CHARACTER_MASTER_XP = Attribute.int(1323);
/** New marks of two menus, 0 once viewed. */
export const CHARACTER_MASTER_BREAK_MARKS = Attribute.intList(1504);

export const masteryRange = (gear: UnitEntity): EntityRange => ({
  first: MASTERY_FIRST + (gear - CHARACTER_FIRST) * 1000,
  count: MASTERY_ENTRIES,
});
