import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { ABILITY_KEYS } from "../../data/skills";

export const ABILITIES = keyTable("ability", ABILITY_KEYS);

export const SKILL_KEY = keyAttribute(3903, ABILITIES);
export const SKILL_FLAGS = Attribute.flags(3904, { acquired: 1, seen: 8 });

/** ability.Key per skill position, on a character, a loadout or a party set member. */
export const EQUIP_SKILLS = Attribute.uintList(1404);
export const SKILL_POSITIONS = 4;
