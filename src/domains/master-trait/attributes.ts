import { Attribute } from "../../core/attribute";
import { hashAttribute, keyTable } from "../../core/keys";
import { SKILLBOARD_EFFECT_KEYS } from "../../data/master-traits";

export const SKILLBOARD_EFFECTS = keyTable(
  "skillboard_effect",
  SKILLBOARD_EFFECT_KEYS,
);

export const MASTER_TRAIT_KEY = hashAttribute(1601);
export const MASTER_TRAIT_CHOSEN = Attribute.int(1602);
