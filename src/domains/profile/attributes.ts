import { Attribute } from "../../core/attribute";
import { keyAttribute } from "../../core/keys";
import { CHARACTERS } from "../character/attributes";

/** The player's own profile card. Other players' cards fill 10700, 10800 and 10900, fifty each. */
export const PROFILE_FIRST = 10600;
/** The last players queued with, newest first. */
export const RECENT_PLAYER_FIRST = 10900;
export const RECENT_PLAYER_COUNT = 50;

export const PLAYER_LAST_SEEN = Attribute.long(4503);
export const PLAYER_NAME = Attribute.text(4506, "byte");
export const PLAYER_ID = Attribute.text(4510, "byte");
export const PLAYER_GRADE = Attribute.int(4706);
export const PLAYER_QUEST = Attribute.uint(4707);
export const PROFILE_QUESTS_CLEARED = Attribute.int(4901);

/** A card's characters sit at card * 100 + index. */
export const CARD_CHARACTER_STRIDE = 100;
export const CARD_CHARACTER_LAST_PLAYED = 0;
export const CARD_CHARACTER_MOST_USED = [10, 11, 12];

export const CARD_CHARACTER_KEY = keyAttribute(4801, CHARACTERS);
export const CARD_CHARACTER_LEVEL = Attribute.int(4803);
export const CARD_CHARACTER_QUESTS_USED = Attribute.int(4804);
export const CARD_CHARACTER_MASTER_LEVEL = Attribute.ubyte(4805);
