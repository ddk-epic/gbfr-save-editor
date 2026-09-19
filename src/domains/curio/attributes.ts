import { Attribute } from "../../core/attribute";
import { hashAttribute, keyAttribute } from "../../core/keys";
import { ITEMS } from "../wrightstone/attributes";

export const CURIO_KEY = keyAttribute(2002, ITEMS);
export const CURIO_SERIAL = Attribute.uint(2003);

/** Reward entries per curio, CURIO_REWARD_KEY at curio entity * 100 + entry. */
export const CURIO_REWARD_ENTRIES = 5;
export const CURIO_REWARD_KEY = hashAttribute(1901);
export const CURIO_REWARD_SEED = Attribute.uint(1903);
export const CURIO_REWARD_LEVEL = Attribute.int(1904);
