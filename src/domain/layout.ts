// SlotData attributes and entity ranges, named as in docs/.

import {
  ARCHIVE_KEYS,
  FIELD_NOTE_CHARACTER_KEYS,
  FIELD_NOTE_FOE_KEYS,
  FIELD_NOTE_WRIGHTSTONE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "../data/journal";
import { CHARACTER_KEYS } from "../data/characters";
import { ITEM_KEYS } from "../data/items";
import { LIMIT_BONUS_PARAM_KEYS } from "../data/masteries";
import { GEM_KEYS, SKILL_KEYS } from "../data/sigils";
import { ABILITY_KEYS } from "../data/skills";
import { SUMMON_KEYS } from "../data/summons";
import { WEAPON_KEYS } from "../data/weapons";
import { Attribute } from "../core/attribute";
import { hashAttribute, keyAttribute } from "./keys";

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
  /** Resonance tree, one PROGRESS_KEY/PROGRESS_VALUE entry per distinct bonus. */
  CONFLUX_TREE: 0,
  CONFLUX_TREE_ENTRIES: 200,
  /** Aura collection, CONFLUX_AURA_KEY and CONFLUX_AURA_FLAGS. */
  CONFLUX_AURA: 0,
  CONFLUX_AURA_COUNT: 300,
  /** Trait lists: TRAIT + owner * 100 + index. */
  TRAIT: 120000000,
  TRAIT_OWNER_WEAPON: 100000,
  TRAIT_OWNER_WRIGHTSTONE: 200000,
} as const;

export const SAVE_WIDE = 0;
export const TRAIT_SLOTS_PER_OWNER = 100;
/** Reward entries per curio, CURIO_REWARD_KEY at curio unit * 100 + entry. */
export const CURIO_REWARD_ENTRIES = 5;
/** Bit of ABILITY_FLAGS set once the ability is seen, clearing its new mark. */
export const ABILITY_SEEN = 8;
export const SIGIL_SLOTS = 12;
export const SKILL_SLOTS = 4;
export const SUMMON_SLOTS = 4;
export const OVER_MASTERY_LINES = 4;
export const WEAPON_TRAIT_SLOTS = 5;

const journalFlags = (id: number) =>
  Attribute.flags(id, { unlocked: 1, viewed: 2 });

export const SYSTEM_PLAY_TIME = Attribute.ulong(812);

export const SAVE_SLOT_VERSION = Attribute.optional<number>(1001, "ushort");
export const SAVE_FEATURE_VERSION = Attribute.optional<number>(1002, "ushort");

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

export const CHARACTER_KEY = keyAttribute(1301, CHARACTER_KEYS);
export const CHARACTER_XP = Attribute.int(1303);
export const CHARACTER_LEVEL = Attribute.int(1308);
export const CHARACTER_BASE_HP = Attribute.int(1309);
export const CHARACTER_BASE_ATTACK = Attribute.int(1310);
export const CHARACTER_QUESTS_USED = Attribute.uint(1314);
export const CHARACTER_MASTER_XP = Attribute.int(1323);

export const EQUIP_WEAPON = Attribute.uint(1402);
export const EQUIP_SIGILS = Attribute.uintList(1403);
export const EQUIP_SKILLS = Attribute.uintList(1404);
export const SUMMONS_EQUIPPED = Attribute.uintList(1451);
export const SUMMON_ID = Attribute.uint(1456);
export const SUMMON_KEY = keyAttribute(1457, SUMMON_KEYS);
export const SUMMON_TRAIT_AND_BONUS = Attribute.uintList(1458);
export const SUMMON_LEVELS = Attribute.intList(1459);
export const SUMMON_FLAGS = Attribute.flags(1460, {
  everEquipped: 1,
  seen: 2,
});

export const PROGRESS_KEY = hashAttribute(1601);
export const PROGRESS_VALUE = Attribute.int(1602);
export const CHARACTER_OVER_MASTERY_KEY = keyAttribute(
  1606,
  LIMIT_BONUS_PARAM_KEYS,
);
export const CHARACTER_OVER_MASTERY_LEVEL = Attribute.int(1607);

export const TRAIT_KEY = keyAttribute(1701, SKILL_KEYS);
export const TRAIT_LEVEL = Attribute.int(1702);

export const ITEM_KEY = keyAttribute(1801, ITEM_KEYS);
export const ITEM_COUNT = Attribute.int(1802);
export const ITEM_FLAGS = Attribute.flags(1803, {
  wishList: 1,
  fieldNote: 4,
  seen: 8,
});

export const CURIO_REWARD_KEY = hashAttribute(1901);
export const CURIO_REWARD_SEED = Attribute.uint(1903);
export const CURIO_REWARD_LEVEL = Attribute.int(1904);
export const CURIO_KEY = keyAttribute(2002, ITEM_KEYS);
export const CURIO_SERIAL = Attribute.uint(2003);

export const WRIGHTSTONE_KEY = keyAttribute(2102, ITEM_KEYS);
export const WRIGHTSTONE_SLOT_ID = Attribute.uint(2103);
export const WRIGHTSTONE_LOCKED = Attribute.bool(2104);
export const WRIGHTSTONE_FLAGS = Attribute.flags(2105, { seen: 2 });

export const PARTY_CHARACTER = keyAttribute(2201, CHARACTER_KEYS);

export const SIDE_QUEST_IDS = Attribute.uintList(2550);
export const SIDE_QUEST_STATE = Attribute.uintList(2551);
export const SIDE_QUEST_ACCEPTED = Attribute.boolList(2555);
export const COUNTER_QUEST_IDS = Attribute.uintList(2570);
export const COUNTER_QUEST_CLEARS = Attribute.uintList(2571);
export const COUNTER_QUEST_FLAGS = Attribute.uintList(2574);
export const COUNTER_QUEST_LAST_CLEARED = Attribute.uintList(2579);

export const SIGIL_SLOT_ID = Attribute.uint(2702);
export const SIGIL_KEY = keyAttribute(2703, GEM_KEYS);
export const SIGIL_LEVEL = Attribute.int(2704);
export const SIGIL_FLAGS = Attribute.flags(2707, { locked: 1, seen: 2 });

export const WEAPON_SLOT_ID = Attribute.uint(2802);
export const WEAPON_KEY = keyAttribute(2803, WEAPON_KEYS);
export const WEAPON_XP = Attribute.uint(2804);
export const WEAPON_UNCAP = Attribute.int(2805);
export const WEAPON_PLUS = Attribute.int(2806);
export const WEAPON_AWAKENING = Attribute.int(2807);
export const WEAPON_QUESTS_USED = Attribute.uint(2813);
export const WEAPON_APPEARANCE = keyAttribute(2814, WEAPON_KEYS);
export const WEAPON_FLAGS = Attribute.flags(2815, {
  seen: 64,
  awakeningSeen: 16,
});
export const WEAPON_WRIGHTSTONE = keyAttribute(2816, ITEM_KEYS);
export const WEAPON_TRANSCENDENCE = Attribute.int(2817);
export const WEAPON_TRAITS = Attribute.uintList(2818);

export const LOADOUT_NAME = Attribute.text(3002, "byte");
export const EQUIP_CHARACTER = keyAttribute(3003, CHARACTER_KEYS);

export const FATE_EPISODE_KEY = hashAttribute(3501);
export const FATE_EPISODE_STATE = Attribute.flags(3502, { completed: 8 });

export const ABILITY_KEY = keyAttribute(3903, ABILITY_KEYS);
export const ABILITY_FLAGS = Attribute.rawFlags(3904);

export const PROFILE_QUESTS_CLEARED = Attribute.int(4901);

export const TROPHY_EARNED = Attribute.boolList(5801);
export const TROPHY_VIEWED = Attribute.boolList(5816);

export const FIELD_NOTE_WEAPON_KEY = keyAttribute(7401, WEAPON_KEYS);
export const FIELD_NOTE_WEAPON_FLAGS = Attribute.flags(7403, { unlocked: 4 });

export const ARCHIVE_KEY = keyAttribute(7901, ARCHIVE_KEYS);
export const ARCHIVE_FLAGS = journalFlags(7902);
export const GLOSSARY_KEY = keyAttribute(8101, GLOSSARY_KEYS);
export const GLOSSARY_FLAGS = journalFlags(8102);
export const STORY_KEY = keyAttribute(8201, STORY_KEYS);
export const STORY_FLAGS = journalFlags(8202);
export const MUSIC_KEY = keyAttribute(8301, MUSIC_KEYS);
export const MUSIC_FLAGS = journalFlags(8302);
export const FIELD_NOTE_CHARACTER_KEY = keyAttribute(
  8401,
  FIELD_NOTE_CHARACTER_KEYS,
);
export const FIELD_NOTE_CHARACTER_FLAGS = journalFlags(8402);
export const FIELD_NOTE_FOE_KEY = keyAttribute(8501, FIELD_NOTE_FOE_KEYS);
export const FIELD_NOTE_FOE_FLAGS = journalFlags(8502);
export const FIELD_NOTE_WRIGHTSTONE_KEY = keyAttribute(
  8601,
  FIELD_NOTE_WRIGHTSTONE_KEYS,
);
export const FIELD_NOTE_WRIGHTSTONE_FLAGS = journalFlags(8602);
export const TIP_KEY = keyAttribute(8701, TIP_KEYS);
export const TIP_FLAGS = journalFlags(8702);

export const CONFLUX_AURA_KEY = hashAttribute(9601);
export const CONFLUX_AURA_FLAGS = Attribute.flags(9602, {
  obtained: 1,
  seen: 2,
});
