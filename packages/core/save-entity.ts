import { Attribute } from "./attribute";

export const SAVE_ENTITY = 0;

export const SAVE_SLOT_VERSION = Attribute.optional<number>(1001, "ushort");
export const SAVE_FEATURE_VERSION = Attribute.optional<number>(1002, "ushort");
/** Picks the SlotData checksum. */
export const SAVE_HASHSEED = Attribute.uint(1003);
