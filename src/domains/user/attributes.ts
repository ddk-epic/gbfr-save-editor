import { Attribute } from "../../core/attribute";

export const SAVE_ENTITY = 0;

/** Seconds, in SystemData. */
export const SYSTEM_PLAY_TIME = Attribute.ulong(812);

export const SAVE_SLOT_VERSION = Attribute.optional<number>(1001, "ushort");
export const SAVE_FEATURE_VERSION = Attribute.optional<number>(1002, "ushort");
/** Picks the SlotData checksum. */
export const SAVE_HASHSEED = Attribute.uint(1003);

export const USER_PLAYER_NAME = Attribute.text(1101, "ushort");
export const USER_CAPTAIN = Attribute.optional<number>(1103, "int");
export const USER_RUPIES = Attribute.int(1104);
export const USER_MAX_RUPIES = 999_999_999;
export const USER_TRANSMARVEL_POINTS = Attribute.int(1105);
export const USER_COMMENDATIONS = Attribute.int(1106);
export const USER_ONLINE_STATUS_FLAGS = Attribute.rawFlags(1108);
export const USER_MASTERY_POINTS = Attribute.int(1112);
export const USER_MAX_MASTERY_POINTS = 9_999_999;
export const USER_RESONANCE_POINTS = Attribute.int(1116);

export const LOCATION_STAGE = Attribute.optional<number>(1201, "int");
export const LOCATION_SPOT = Attribute.text(1202, "ubyte");
export const LOCATION_PARTY_HP = Attribute.intList(1206);
