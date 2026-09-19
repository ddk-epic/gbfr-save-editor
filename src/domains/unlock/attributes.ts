import { Attribute } from "../../core/attribute";
import { hashAttribute } from "../../core/keys";

/**
 * The Resonance tree, mastery nodes and master trait cells all store through
 * this pair, told apart only by entity range and by which table recognises
 * the hash.
 */
export const UNLOCK_KEY = hashAttribute(1601);
export const UNLOCK_VALUE = Attribute.int(1602);
