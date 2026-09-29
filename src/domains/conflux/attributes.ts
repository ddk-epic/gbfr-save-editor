import { Attribute } from "../../core/attribute";
import { hashAttribute } from "../../core/keys";
import type { EntityRange } from "../../core/unit-store";

/** Resonance tree, one RESONANCE_KEY/RESONANCE_BITS entry per distinct bonus. */
export const CONFLUX_TREE_RANGE: EntityRange = { first: 0, count: 200 };

export const RESONANCE_KEY = hashAttribute(1601);
export const RESONANCE_BITS = Attribute.int(1602);

export const CONFLUX_AURA_RANGE: EntityRange = { first: 0, count: 300 };

export const CONFLUX_AURA_KEY = hashAttribute(9601);
export const CONFLUX_AURA_FLAGS = Attribute.flags(9602, {
  obtained: 1,
  seen: 2,
});
