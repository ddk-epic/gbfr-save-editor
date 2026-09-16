// SlotData IDTypes and UnitID bases the domain reads.

import { hashId } from "../hash/xxhash32-custom";

/** Hash of "", the save's value for an empty id. */
export const EMPTY_HASH = hashId("");

export const ID = {
  CAPTAIN: 1103,
  RUPIES: 1104,
  MASTERY_POINTS: 1112,
  CHARACTER_KEY: 1301,
  CHARACTER_XP: 1303,
  CHARACTER_LEVEL: 1308,
  CHARACTER_BASE_HP: 1309,
  CHARACTER_BASE_ATTACK: 1310,
  CHARACTER_QUESTS_USED: 1314,
  MASTER_XP: 1323,
  EQUIP_WEAPON: 1402,
  EQUIP_SIGILS: 1403,
  EQUIP_SKILLS: 1404,
  SUMMONS_EQUIPPED: 1451,
  SUMMON_ID: 1456,
  SUMMON_KEY: 1457,
  SUMMON_TRAIT_AND_BONUS: 1458,
  SUMMON_LEVELS: 1459,
  SUMMON_FLAGS: 1460,
  PROGRESS_KEY: 1601,
  PROGRESS_VALUE: 1602,
  OVER_MASTERY_KEY: 1606,
  OVER_MASTERY_LEVEL: 1607,
  TRAIT_KEY: 1701,
  SIDE_QUEST_IDS: 2550,
  SIDE_QUEST_STATE: 2551,
  SIDE_QUEST_ACCEPTED: 2555,
  COUNTER_QUEST_IDS: 2570,
  COUNTER_QUEST_CLEARS: 2571,
  COUNTER_QUEST_FLAGS: 2574,
  COUNTER_QUEST_LAST_CLEARED: 2579,
  TROPHY_EARNED: 5801,
  ARCHIVE_KEY: 7901,
  ARCHIVE_FLAGS: 7902,
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
  WRIGHTSTONE_KEY: 2102,
  WRIGHTSTONE_SLOT_ID: 2103,
  WRIGHTSTONE_LOCKED: 2104,
  WRIGHTSTONE_FLAGS: 2105,
  TRAIT_LEVEL: 1702,
  SIGIL_SLOT_ID: 2702,
  SIGIL_KEY: 2703,
  SIGIL_LEVEL: 2704,
  SIGIL_FLAGS: 2707,
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
/** Bit of COUNTER_QUEST_FLAGS set once an S++ clear is earned. */
export const QUEST_PERFECT_GRADE = 1;
/** Bits of ARCHIVE_FLAGS: the document is obtained, and seen in the journal list. */
export const ARCHIVE_OBTAINED = 1;
export const ARCHIVE_VIEWED = 2;
/** Bits of GLOSSARY_FLAGS: listed, new mark cleared, and bits 2-4 for paragraphs 2-4. */
export const GLOSSARY_LISTED = 1;
export const GLOSSARY_VIEWED = 2;
export const GLOSSARY_PARAGRAPHS_2_TO_4 = 0b11100;
/** Bits of TIP_FLAGS: listed, and seen in the journal list. */
export const TIP_LISTED = 1;
export const TIP_VIEWED = 2;
/** Bits of MUSIC_FLAGS: listed, and seen in the journal list. */
export const MUSIC_LISTED = 1;
export const MUSIC_VIEWED = 2;
/** Bit of ITEM_FLAGS set on an item on the wish list, at most 20. */
export const ITEM_WISH_LIST = 1;
/** Bit of ITEM_FLAGS set once the item is seen, clearing its new mark. */
export const ITEM_SEEN = 8;
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
