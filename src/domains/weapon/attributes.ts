import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { WEAPON_KEYS } from "../../data/weapons";
import { ITEMS } from "../wrightstone/attributes";

export const WEAPONS = keyTable("weapon", WEAPON_KEYS);

export const WEAPON_FIRST = 40000;

export const WEAPON_ID = Attribute.uint(2802);
export const WEAPON_KEY = keyAttribute(2803, WEAPONS);
export const WEAPON_XP = Attribute.uint(2804);
export const WEAPON_UNCAP = Attribute.int(2805);
export const WEAPON_PLUS = Attribute.int(2806);
export const WEAPON_AWAKENING = Attribute.int(2807);
export const WEAPON_QUESTS_USED = Attribute.uint(2813);
export const WEAPON_APPEARANCE = keyAttribute(2814, WEAPONS);
export const WEAPON_FLAGS = Attribute.flags(2815, {
  owned: 1,
  seen: 64,
  awakeningSeen: 16,
});
export const WEAPON_WRIGHTSTONE = keyAttribute(2816, ITEMS);
export const WEAPON_TRANSCENDENCE = Attribute.int(2817);
export const WEAPON_TRAITS = Attribute.uintList(2818);

export const WEAPON_TRAIT_POSITIONS = 5;

export const WEAPON_SERIES_ORDER = [4, 1, 2, 3, 5, 0, 6, 7];
