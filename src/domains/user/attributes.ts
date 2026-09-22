import { Attribute } from "../../core/attribute";

/** Attributes about the save itself have no thing to name, so they sit at 0. */
export const SAVE_ENTITY = 0;

/** Seconds, capped at 3,599,999. Lives in SystemData, not SlotData. */
export const SYSTEM_PLAY_TIME = Attribute.ulong(812);

export const SAVE_SLOT_VERSION = Attribute.optional<number>(1001, "ushort");
export const SAVE_FEATURE_VERSION = Attribute.optional<number>(1002, "ushort");
/** Rerolled on every game save; picks the SlotData checksum the game checks. */
export const SAVE_HASHSEED = Attribute.uint(1003);

export const USER_PLAYER_NAME = Attribute.text(1101, "ushort");
export const USER_CAPTAIN = Attribute.optional<number>(1103, "int");
export const USER_RUPIES = Attribute.int(1104);
export const USER_COMMENDATIONS = Attribute.int(1106);
export const USER_ONLINE_STATUS_FLAGS = Attribute.rawFlags(1108);
export const USER_MASTERY_POINTS = Attribute.int(1112);
export const USER_RESONANCE_POINTS = Attribute.int(1116);

export const LOCATION_STAGE = Attribute.optional<number>(1201, "int");
export const LOCATION_SPOT = Attribute.text(1202, "ubyte");
export const LOCATION_PARTY_HP = Attribute.intList(1206);
