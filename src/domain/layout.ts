// SlotData IDTypes and UnitID bases, named as in docs/.

import { hashId } from "../hash/xxhash32-custom";

/** Hash of "", the save's value for an empty id. */
export const EMPTY_HASH = hashId("");

export const ID = {
  SYSTEM_HASHSEED: 803,
  SYSTEM_HASHSEED_2: 811,
  SYSTEM_PLAY_TIME: 812,
  SYSTEM_STAGE: 813,
  SYSTEM_PLAYER_NAME: 814,
  SYSTEM_STAGE_2: 819,
  SYSTEM_PLAYER_NAME_2: 834,
  SAVE_SLOT_VERSION: 1001,
  SAVE_FEATURE_VERSION: 1002,
  SAVE_HASHSEED: 1003,
  USER_PLAYER_NAME: 1101,
  USER_CAPTAIN: 1103,
  USER_RUPIES: 1104,
  USER_COMMENDATIONS: 1106,
  USER_ONLINE_STATUS_FLAGS: 1108,
  USER_MASTERY_POINTS: 1112,
  USER_RESONANCE_POINTS: 1116,
  LOCATION_STAGE: 1201,
  LOCATION_SPOT: 1202,
  LOCATION_PARTY_HP: 1206,
  CHARACTER_KEY: 1301,
  CHARACTER_XP: 1303,
  CHARACTER_FLAGS: 1305,
  CHARACTER_LEVEL: 1308,
  CHARACTER_BASE_HP: 1309,
  CHARACTER_BASE_ATTACK: 1310,
  CHARACTER_BASE_STUN: 1312,
  CHARACTER_BASE_CRIT: 1313,
  CHARACTER_QUESTS_USED: 1314,
  CHARACTER_MASTER_XP: 1323,
  CHARACTER_DELEGATE_ENLISTED: 1324,
  CHARACTER_DELEGATE_MESSAGE: 1326,
  EQUIP_WEAPON: 1402,
  EQUIP_SIGILS: 1403,
  EQUIP_SKILLS: 1404,
  SUMMONS_EQUIPPED: 1451,
  SUMMONS_KEY: 1452,
  SUMMONS_OBTAINED: 1453,
  SUMMON_LAST_ID: 1454,
  SUMMON_ID: 1456,
  SUMMON_KEY: 1457,
  SUMMON_TRAIT_AND_BONUS: 1458,
  SUMMON_LEVELS: 1459,
  SUMMON_FLAGS: 1460,
  PROGRESS_KEY: 1601,
  PROGRESS_VALUE: 1602,
  CHARACTER_OVER_MASTERY_KEY: 1606,
  CHARACTER_OVER_MASTERY_LEVEL: 1607,
  TRAIT_KEY: 1701,
  SIDE_QUEST_IDS: 2550,
  SIDE_QUEST_STATE: 2551,
  SIDE_QUEST_ACCEPTED: 2555,
  COUNTER_QUEST_IDS: 2570,
  COUNTER_QUEST_CLEARS: 2571,
  COUNTER_QUEST_FLAGS: 2574,
  COUNTER_QUEST_LAST_CLEARED: 2579,
  TROPHY_EARNED: 5801,
  TROPHY_VIEWED: 5816,
  ARCHIVE_KEY: 7901,
  ARCHIVE_FLAGS: 7902,
  STORY_KEY: 8201,
  STORY_FLAGS: 8202,
  FIELD_NOTE_CHARACTER_KEY: 8401,
  FIELD_NOTE_CHARACTER_FLAGS: 8402,
  FIELD_NOTE_FOE_KEY: 8501,
  FIELD_NOTE_FOE_FLAGS: 8502,
  FIELD_NOTE_WRIGHTSTONE_KEY: 8601,
  FIELD_NOTE_WRIGHTSTONE_FLAGS: 8602,
  FIELD_NOTE_WEAPON_KEY: 7401,
  FIELD_NOTE_WEAPON_FLAGS: 7403,
  GLOSSARY_KEY: 8101,
  GLOSSARY_FLAGS: 8102,
  TIP_KEY: 8701,
  TIP_FLAGS: 8702,
  MUSIC_KEY: 8301,
  MUSIC_FLAGS: 8302,
  CURIO_REWARD_KEY: 1901,
  CURIO_REWARD_SEED: 1903,
  CURIO_REWARD_LEVEL: 1904,
  CURIO_KEY: 2002,
  CURIO_SERIAL: 2003,
  ITEM_KEY: 1801,
  ITEM_COUNT: 1802,
  ITEM_FLAGS: 1803,
  WRIGHTSTONE_LAST_SLOT_ID: 2101,
  WRIGHTSTONE_KEY: 2102,
  WRIGHTSTONE_SLOT_ID: 2103,
  WRIGHTSTONE_LOCKED: 2104,
  WRIGHTSTONE_FLAGS: 2105,
  TRAIT_LEVEL: 1702,
  SIGIL_LAST_SLOT_ID: 2701,
  SIGIL_SLOT_ID: 2702,
  SIGIL_KEY: 2703,
  SIGIL_LEVEL: 2704,
  SIGIL_WORN_BY: 2706,
  SIGIL_FLAGS: 2707,
  WEAPON_LAST_SLOT_ID: 2801,
  WEAPON_SLOT_ID: 2802,
  WEAPON_KEY: 2803,
  WEAPON_XP: 2804,
  WEAPON_UNCAP: 2805,
  WEAPON_PLUS: 2806,
  WEAPON_AWAKENING: 2807,
  WEAPON_WRIGHTSTONE: 2816,
  WEAPON_TRANSCENDENCE: 2817,
  WEAPON_QUESTS_USED: 2813,
  WEAPON_APPEARANCE: 2814,
  WEAPON_FLAGS: 2815,
  ABILITY_KEY: 3903,
  ABILITY_FLAGS: 3904,
  PROFILE_QUESTS_CLEARED: 4901,
  WEAPON_TRAITS: 2818,
  PARTY_CHARACTER: 2201,
  LOADOUT_NAME: 3002,
  FATE_EPISODE_KEY: 3501,
  FATE_EPISODE_STATE: 3502,
  EQUIP_CHARACTER: 3003,
} as const;

export const UNIT = {
  /** Summon inventory, 1000 units; 1451 at unit 0 holds the equipped ids. */
  SUMMON: 0,
  /** One per character, in 1301 order. */
  CHARACTER: 10000,
  /** Loadouts, 15 per character. */
  LOADOUT: 20000,
  LOADOUT_COUNT: 615,
  SIGIL: 30000,
  WEAPON: 40000,
  /** Wrightstone inventory, 5000 units. */
  WRIGHTSTONE: 50000,
  /** The player's own profile card. Other players' cards sit at 10700, 10800 and 10900. */
  PROFILE: 10600,
  /** Current party, 4 slots. */
  PARTY: 103000,
  PARTY_SIZE: 4,
  /**
   * Per-character progress, CHARACTER_PROGRESS + character index * 1000 + entry:
   * Masteries nodes, then master trait cells. Over-mastery lines use the same base.
   */
  CHARACTER_PROGRESS: 10000000,
  CHARACTER_PROGRESS_ENTRIES: 400,
  /** Trait lists: TRAIT + owner * 100 + index. */
  TRAIT: 120000000,
  TRAIT_OWNER_WEAPON: 100000,
  TRAIT_OWNER_WRIGHTSTONE: 200000,
} as const;

/** Reward entries per curio, CURIO_REWARD_KEY at curio unit * 100 + entry. */
export const CURIO_REWARD_ENTRIES = 5;
/** Bits every journal list's flags unit uses: ARCHIVE, GLOSSARY, TIP, MUSIC
 * and STORY_FLAGS alike. Field Notes uses bit 0 too, bit 2 on Weapons. */
export const JOURNAL_UNLOCKED = 1;
export const JOURNAL_VIEWED = 2;
/** The unlocked bit on FIELD_NOTE_WEAPON_FLAGS, a unit the weapon list shares. */
export const FIELD_NOTE_WEAPON_UNLOCKED = 4;
/** Bit of ITEM_FLAGS set on an item on the wish list, at most 20. */
export const ITEM_WISH_LIST = 1;
/** Bit of ITEM_FLAGS set once the item is seen, clearing its new mark. */
export const ITEM_SEEN = 8;
/** Bit of ITEM_FLAGS set once the item has a page in Field Notes Treasure. */
export const ITEM_FIELD_NOTE = 4;
/** Bit of ABILITY_FLAGS set once the ability is seen, clearing its new mark. */
export const ABILITY_SEEN = 8;
/** Bit of WEAPON_FLAGS set once the weapon is seen in the transwakening menu. */
export const WEAPON_SEEN = 64;
/** Bit of WEAPON_FLAGS set on an awakenable weapon once seen in the upgrade menu. */
export const WEAPON_AWAKENING_SEEN = 16;
/** Bit of WRIGHTSTONE_FLAGS set once the stone is seen, clearing its new mark. */
export const WRIGHTSTONE_SEEN = 2;
/** Bits of SIGIL_FLAGS: locked, and seen, clearing the new mark. */
export const SIGIL_LOCKED = 1;
export const SIGIL_SEEN = 2;
export const SIGIL_SLOTS = 12;
export const SKILL_SLOTS = 4;
export const SUMMON_SLOTS = 4;
/** Bits of SUMMON_FLAGS: equipped at least once, and seen, clearing the new mark. */
export const SUMMON_EVER_EQUIPPED = 1;
export const SUMMON_SEEN = 2;
export const OVER_MASTERY_LINES = 4;
export const WEAPON_TRAIT_SLOTS = 5;
