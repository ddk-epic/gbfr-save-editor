import { Attribute } from "../../core/attribute";
import { keyAttribute, keyTable } from "../../core/keys";
import { ABILITY_KEYS } from "../../data/skills";

export const ABILITIES = keyTable("ability", ABILITY_KEYS);

export const ABILITY_KEY = keyAttribute(3903, ABILITIES);
export const ABILITY_FLAGS = Attribute.rawFlags(3904);

export const ABILITY_ACQUIRED = 1;
export const ABILITY_SEEN = 8;

export const ABILITY_POSITIONS = 4;
