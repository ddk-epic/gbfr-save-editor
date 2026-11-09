import { type Attribute, hashId, SAVE_ENTITY } from "@gbfr/core";
import type { Patch, SaveSession } from "@gbfr/core/session";
import {
  CAPTAIN,
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_OUTFIT,
  CHARACTER_OUTFITS_OWNED,
  CHARACTER_XP,
  masteryRange,
  joinedCharacters,
} from "@gbfr/character";
import { acquisitions } from "@gbfr/item/edit";
import { FATE_EPISODE_KEY, FATE_EPISODE_STATE } from "@gbfr/fate-episode";
import { EQUIP_WEAPON } from "@gbfr/equipment";
import {
  ITEM_ACQUIRED,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
  itemHash,
} from "@gbfr/item";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
} from "@gbfr/journal";
import { MASTERY_NODE_BITS } from "@gbfr/mastery";
import { COUNTER_QUEST_IDS, COUNTER_QUEST_OPENED } from "@gbfr/quest";
import { EQUIP_SKILLS, SKILL_FLAGS, SKILL_KEY } from "@gbfr/skill";
import {
  ARCHIVES_UNLOCKED_COUNTERS,
  CHAPTER_KEYS_CLEARED,
  RUPIES_EARNED,
  SIDE_QUESTS_COMPLETED,
  STORY_MASTERY_FILLED,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  earnedCounter,
} from "@gbfr/trophy";
import { USER_MAX_RUPIES, USER_RUPIES } from "@gbfr/user";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "@gbfr/weapon";
import {
  CURRENT_CHAPTER,
  isChapterCheckpoint,
  STORY_CHECKPOINTS,
  UI_FEATURE_UNLOCKED,
} from "@gbfr/story";
import {
  clearCounterQuests,
  clearStoryCutscenes,
  storyPosition,
} from "@gbfr/story/edit";

type ItemFlags = Parameters<typeof ITEM_FLAGS.write>[0];
type ArchiveFlags = Parameters<typeof ARCHIVE_FLAGS.write>[0];
type WeaponFlags = Parameters<typeof WEAPON_FLAGS.write>[0];

const START_WEAPON_XP = 90;
const RAISED_WEAPON_XP = 1740;
const RAISED_WEAPON_UNCAP = 3;
const FIGHT_WEAPON_XP = 162540;
const FIGHT_WEAPON_UNCAP = 6;
const WEAPON_ENTRIES = 256;
const OUTFIT_MAIN = 0;
const OUTFIT_STARTING = 1;

interface StoryFillEntry {
  /** `StoryCheckpoint.id` the entry is due by. */
  checkpoint: string;
  /** `badge.Key`. */
  trophies: readonly number[];
  chapterKeysCleared: bigint;
  items?: readonly { item: string; flags: ItemFlags }[];
  /** Items the row takes back, leaving their flags and 1804. */
  takenItems?: readonly string[];
  /** Held items whose new mark comes back. */
  newMarks?: readonly string[];
  archives?: readonly { archive: string; flags: ArchiveFlags }[];
  uiFeatures?: readonly number[];
  storyCutscenes?: readonly number[];
  counterQuests?: readonly number[];
  openedQuests?: readonly number[];
  startWeapons?: readonly { key: string; captain: number; replaces: string }[];
  standInWeapons?: readonly { key: string; xp: number; uncap: number }[];
  fightWeapons?: readonly {
    key: string;
    captain: number;
    startWeapon: string;
  }[];
  joinsId?: boolean;
  /** `fate_episode.Key`, marked started and completed. */
  fateEpisodes?: readonly string[];
  /** `TROPHY_PROGRESS` indexes and the amount each rises by, once the entry earns a trophy. */
  counts?: readonly (readonly [index: number, amount: number])[];
  /** Items given as rewards, by key and count, once the entry earns a trophy. */
  rewards?: readonly (readonly [item: string, count: number])[];
}

/** In story order. */
const STORY_FILL: readonly StoryFillEntry[] = [
  {
    checkpoint: "chapter2",
    trophies: [0, 10, 1, 1405],
    chapterKeysCleared: 4n,
    uiFeatures: [7],
  },
  {
    checkpoint: "chapter3",
    trophies: [2, 1406],
    chapterKeysCleared: 6n,
    items: [{ item: "ITEM_70_0004", flags: { fieldNote: true } }],
  },
  {
    checkpoint: "chapter4",
    trophies: [3, 1407],
    chapterKeysCleared: 9n,
    items: [{ item: "ITEM_70_0005", flags: { fieldNote: true } }],
    newMarks: ["ITEM_70_0001"],
    archives: [{ archive: "ARC_OTHER_011", flags: { unlocked: true } }],
    startWeapons: [
      { key: "WEP_PL0000_03", captain: 10000, replaces: "WEP_PL0000_01" },
      { key: "WEP_PL0100_03", captain: 10001, replaces: "WEP_PL0100_01" },
    ],
  },
  {
    checkpoint: "chapter5",
    trophies: [4, 1408],
    chapterKeysCleared: 13n,
  },
  {
    checkpoint: "chapter6",
    trophies: [5, 1409],
    chapterKeysCleared: 18n,
  },
  {
    checkpoint: "chapter7",
    trophies: [6, 1410],
    chapterKeysCleared: 22n,
    items: [{ item: "ITEM_70_0008", flags: { fieldNote: true } }],
    storyCutscenes: [0x730050],
  },
  {
    checkpoint: "chapter8",
    trophies: [7, 1411],
    chapterKeysCleared: 26n,
    items: [{ item: "ITEM_70_0006", flags: { fieldNote: true } }],
    takenItems: ["ITEM_70_0008"],
    archives: [
      { archive: "ARC_OTHER_026", flags: { unlocked: true } },
      { archive: "ARC_OTHER_058", flags: { unlocked: true } },
      { archive: "ARC_OTHER_059", flags: { unlocked: true } },
      { archive: "ARC_OTHER_060", flags: { unlocked: true } },
    ],
    standInWeapons: [
      { key: "WEP_PL1900_A0", xp: 790, uncap: 2 },
      { key: "WEP_NP0300_01", xp: 1140, uncap: 2 },
    ],
  },
  {
    checkpoint: "chapter9",
    trophies: [8, 1412],
    chapterKeysCleared: 30n,
    standInWeapons: [{ key: "WEP_NP0300_01", xp: 1740, uncap: 2 }],
    fightWeapons: [
      { key: "WEP_PL0000_99", captain: 10000, startWeapon: "WEP_PL0000_03" },
      { key: "WEP_PL0100_99", captain: 10001, startWeapon: "WEP_PL0100_03" },
    ],
  },
  {
    checkpoint: "finalChapter",
    trophies: [9, 1413],
    chapterKeysCleared: 36n,
    items: [
      { item: "ITEM_70_0010", flags: { fieldNote: true, keyItem: true } },
    ],
    newMarks: ["ITEM_70_0003"],
    archives: [
      { archive: "ARC_ROLANNOTE_08", flags: { unlocked: true, seen: true } },
    ],
    standInWeapons: [
      { key: "WEP_PL1900_A0", xp: 1740, uncap: 3 },
      { key: "WEP_NP0300_01", xp: 2740, uncap: 3 },
    ],
  },
  {
    checkpoint: "chapterZero",
    trophies: [11, 1397],
    chapterKeysCleared: 38n,
    uiFeatures: [0, 1, 2, 3, 4, 5, 6],
    joinsId: true,
  },
  {
    checkpoint: "chapterZeroEnd",
    trophies: [22, 23, 24, 25, 19, 1398],
    chapterKeysCleared: 41n,
    archives: [
      { archive: "ARC_ROLANNOTE_02", flags: { unlocked: true, seen: true } },
      { archive: "ARC_ROLANNOTE_03", flags: { unlocked: true, seen: true } },
      { archive: "ARC_ROLANNOTE_06", flags: { unlocked: true } },
      { archive: "ARC_ROLANNOTE_01", flags: { unlocked: true } },
      { archive: "ARC_ROLANNOTE_04", flags: { unlocked: true } },
      { archive: "ARC_ROLANNOTE_05", flags: { unlocked: true } },
      { archive: "ARC_ROLANNOTE_07", flags: { unlocked: true } },
    ],
    storyCutscenes: [
      0x705001, 0x705002, 0x705003, 0x705004, 0x705005, 0x705006, 0x705007,
      0x703000, 0x703001, 0x720000, 0x720001, 0x720002, 0x720003, 0x720004,
      0x704000, 0x704001, 0x730045,
    ],
    counterQuests: [
      0x403301, 0x403302, 0x403201, 0x403202, 0x403307, 0x403308, 0x403309,
      0x403312, 0x404101, 0x404310, 0x404309, 0x404313, 0x404316, 0x404311,
      0x405101, 0x405201, 0x405206, 0x405207, 0x405202, 0x405203, 0x405208,
      0x405302, 0x405303, 0x405304, 0x405305,
    ],
    openedQuests: [
      0x404317, 0x404204, 0x403311, 0x403303, 0x402316, 0x402315, 0x402314,
      0x402313, 0x402308, 0x402302, 0x402301, 0x401316, 0x401315, 0x401311,
      0x401310, 0x401306, 0x401305, 0x401303, 0x401301,
    ],
  },
  {
    checkpoint: "promoteToProud",
    trophies: [542],
    chapterKeysCleared: 41n,
    storyCutscenes: [0x725100, 0x730311, 0x730000, 0x730001],
  },
  {
    checkpoint: "dlcStart",
    // The side quests' first clear, and Conflux Cycles 1-3.
    trophies: [52, 1594, 1595, 1253, 1470],
    chapterKeysCleared: 41n,
    counts: [
      [SIDE_QUESTS_COMPLETED, 2],
      [1139, 1],
      [1140, 1],
      [917, 1],
    ],
    rewards: [["ITEM_23_0000", 2]], // Crewmate Card
    storyCutscenes: [0x725101, 0x710010],
  },
  { checkpoint: "unlockChaos", trophies: [746, 1468], chapterKeysCleared: 41n },
  {
    checkpoint: "unlockChaosPlus",
    // Conflux Cycle 4.
    trophies: [747, 1467, 1254, 1469],
    chapterKeysCleared: 41n,
    counts: [[918, 1]],
    // From `0010B002` and `00730331`-`00730333`.
    items: [
      { item: "CF24B2F6", flags: { fieldNote: true } },
      { item: "C93E2FDD", flags: { fieldNote: true } },
      { item: "8BF58697", flags: { fieldNote: true } },
      { item: "84292D6A", flags: { fieldNote: true } },
      { item: "54AE4C95", flags: { fieldNote: true } },
      { item: "75A25FB1", flags: { fieldNote: true } },
    ],
    fateEpisodes: ["FATE_PL2900_01", "FATE_PL2900_02", "FATE_PL2900_03"],
    standInWeapons: [
      { key: "WEP_PL2800_A0", xp: FIGHT_WEAPON_XP, uncap: FIGHT_WEAPON_UNCAP },
    ],
  },
];

/** Rupies and items the game does not give for a trophy written here, by `badge.Key`. */
const TROPHY_REWARDS: Readonly<
  Record<number, { rupies: number; items?: readonly [string, number][] }>
> = {
  22: {
    rupies: 20000,
    items: [
      ["ITEM_10_0001", 50],
      ["ITEM_10_0002", 5],
    ],
  },
  23: {
    rupies: 30000,
    items: [
      ["ITEM_10_0001", 50],
      ["ITEM_10_0002", 25],
    ],
  },
  24: {
    rupies: 30000,
    items: [
      ["ITEM_10_0002", 50],
      ["ITEM_10_0003", 10],
    ],
  },
};

const ID_MAX_JOIN_LEVEL = 42;
/** XP, base HP and base attack per level. */
const ID_LEVELS: Readonly<Record<number, readonly [number, number, number]>> = {
  36: [172152, 1078, 141],
  37: [184474, 1107, 145],
  38: [196869, 1136, 149],
  39: [209309, 1166, 153],
  40: [222310, 1195, 157],
  41: [235348, 1224, 161],
  42: [248461, 1254, 165],
};
const ID_EQUIPPED_SKILLS = ["01", "05", "02", "07"];
const ID_ACQUIRED_SKILLS = ["02", "05", "07", "08"];
/** `MASTERY_NODE_BITS` by offset into the mastery block. */
const ID_MASTERY_BITS: Readonly<Record<number, number>> = {
  0: 257,
  1: 1799,
  2: 257,
  3: 771,
  4: 3855,
  5: 257,
  6: 257,
  7: 771,
  8: 771,
  9: 3855,
  10: 257,
  11: 771,
  12: 257,
  13: 7967,
  14: 257,
  15: 257,
  16: 65535,
  17: 257,
  18: 257,
  19: 257,
  20: 257,
  21: 257,
  22: 257,
  23: 257,
  24: 771,
  25: 257,
  26: 771,
  27: 771,
  28: 771,
  29: 257,
  30: 257,
  31: 257,
  32: 257,
  33: 771,
  34: 771,
  35: 257,
  36: 257,
  37: 257,
  38: 257,
  39: 257,
  40: 771,
  41: 257,
  42: 257,
  108: 65535,
  109: 257,
  110: 771,
  111: 257,
  112: 257,
  113: 771,
  114: 771,
  115: 1799,
  116: 3855,
  117: 257,
  118: 257,
  119: 771,
  120: 3855,
  121: 771,
  122: 771,
  123: 771,
  124: 771,
  125: 771,
  126: 257,
  127: 32639,
  128: 771,
  129: 771,
  130: 3855,
  131: 257,
  132: 257,
  133: 771,
  134: 257,
};

/** Adds what the checkpoints up to the save's current one should have left, and returns what it added. */
export function fillSkippedStory(session: SaveSession): string[] {
  const reached = storyPosition(session.save);
  if (reached === undefined) {
    const chapter = session.save.slotData.units
      .of(SAVE_ENTITY)
      .get(CURRENT_CHAPTER)[0]!;
    return applyFill(
      session,
      STORY_FILL.filter(({ checkpoint }) => {
        const due = checkpointAt(checkpoint);
        return isChapterCheckpoint(due) && due.key <= chapter;
      }),
    );
  }
  return applyFill(
    session,
    STORY_FILL.filter(
      ({ checkpoint }) => checkpointIndex(checkpoint) <= reached,
    ),
  );
}

const checkpointIndex = (id: string) => {
  const index = STORY_CHECKPOINTS.findIndex(
    (checkpoint) => checkpoint.id === id,
  );
  if (index === -1) throw new Error(`no story checkpoint ${id}`);
  return index;
};

const checkpointAt = (id: string) => STORY_CHECKPOINTS[checkpointIndex(id)]!;

function applyFill(
  session: SaveSession,
  due: readonly StoryFillEntry[],
): string[] {
  const units = session.save.slotData.units;
  const at = units.of(SAVE_ENTITY);
  const patches: Patch[] = [];
  const added = [
    ...clearStoryCutscenes(
      session,
      due.flatMap(({ storyCutscenes }) => storyCutscenes ?? []),
    ),
    ...clearCounterQuests(
      session,
      due.flatMap(({ counterQuests }) => counterQuests ?? []),
    ),
  ];

  const earned = [...at.get(TROPHY_EARNED)];
  const progress = [...at.get(TROPHY_PROGRESS)];
  const uiFeatures = [...at.get(UI_FEATURE_UNLOCKED)];
  const counterQuestIds = at.get(COUNTER_QUEST_IDS);
  const counterQuestOpened = [...at.get(COUNTER_QUEST_OPENED)];
  const rewardItems = new Map<string, number>();
  const givenItems = new Set<string>();
  const stamps = acquisitions(units);
  let rupies = at.get(USER_RUPIES);
  let weaponId = at.get(WEAPON_LAST_ID);
  const writtenWeaponIds = new Map<number, number>();
  const captainInPlay = at.get(CAPTAIN) === 2 ? 10001 : 10000;
  const startWeaponEntities = new Map<number, number>();
  const standInEntities = new Map<string, number>();
  const fieldNoted = (key: string) =>
    Number(
      units.values(
        FIELD_NOTE_WEAPON_FLAGS,
        units.onlyEntityWhere(FIELD_NOTE_WEAPON_KEY, hashId(key)),
      )![0],
    ) !== 0;
  const addWeapon = (
    key: string,
    xp: number,
    uncap: number,
    flags: WeaponFlags,
  ) => {
    let entity = WEAPON_FIRST;
    while (
      (writtenWeaponIds.get(entity) ?? units.of(entity).get(WEAPON_ID)) !== 0
    ) {
      entity++;
      if (entity >= WEAPON_FIRST + WEAPON_ENTRIES)
        throw new Error("no free weapon entry");
    }
    weaponId++;
    writtenWeaponIds.set(entity, weaponId);
    const hash = hashId(key);
    const weapon = units.of(entity);
    patches.push(
      weapon.patch(WEAPON_ID, weaponId),
      weapon.patch(WEAPON_KEY, key),
      weapon.patch(WEAPON_XP, xp),
      weapon.patch(WEAPON_UNCAP, uncap),
      weapon.replace(WEAPON_FLAGS, flags),
      units
        .of(units.onlyEntityWhere(FIELD_NOTE_WEAPON_KEY, hash))
        .replace(FIELD_NOTE_WEAPON_FLAGS, { unlocked: true }),
    );
    return { entity, id: weaponId };
  };

  for (const entry of due) {
    let earnedHere = false;
    for (const trophy of entry.trophies) {
      if (earned[trophy]) continue;
      earnedHere = true;
      earned[trophy] = true;
      const counter = earnedCounter(trophy);
      if (counter !== undefined) progress[counter] = progress[counter]! + 1n;
      added.push(`trophy ${trophy}`);

      const reward = TROPHY_REWARDS[trophy];
      if (!reward) continue;
      rupies = Math.min(rupies + reward.rupies, USER_MAX_RUPIES);
      progress[RUPIES_EARNED] =
        progress[RUPIES_EARNED]! + BigInt(reward.rupies);
      for (const [item, count] of reward.items ?? [])
        rewardItems.set(item, (rewardItems.get(item) ?? 0) + count);
    }
    for (const [index, amount] of earnedHere ? (entry.counts ?? []) : [])
      progress[index] = progress[index]! + BigInt(amount);
    for (const [item, count] of earnedHere ? (entry.rewards ?? []) : []) {
      rewardItems.set(item, (rewardItems.get(item) ?? 0) + count);
      added.push(item);
    }
    if (entry.chapterKeysCleared > progress[CHAPTER_KEYS_CLEARED]!)
      progress[CHAPTER_KEYS_CLEARED] = entry.chapterKeysCleared;

    for (const { item, flags } of entry.items ?? []) {
      const entity = units.onlyEntityWhere(ITEM_KEY, itemHash(item));
      if (units.of(entity).get(ITEM_ACQUIRED) !== 0) continue;
      const held = units.of(entity);
      patches.push(
        held.patch(ITEM_COUNT, 1),
        held.replace(ITEM_FLAGS, flags),
        stamps.stamp(entity),
      );
      givenItems.add(item);
      added.push(item);
    }

    for (const key of entry.fateEpisodes ?? []) {
      const episode = units.of(
        units.onlyEntityWhere(FATE_EPISODE_KEY, hashId(key)),
      );
      if (episode.get(FATE_EPISODE_STATE).completed) continue;
      patches.push(
        episode.patch(FATE_EPISODE_STATE, { started: true, completed: true }),
      );
      added.push(key);
    }

    for (const item of entry.takenItems ?? []) {
      const entity = units.onlyEntityWhere(ITEM_KEY, itemHash(item));
      if (!givenItems.has(item) && units.of(entity).get(ITEM_COUNT) === 0)
        continue;
      patches.push(units.of(entity).patch(ITEM_COUNT, 0));
      added.push(`${item} taken`);
    }

    for (const item of entry.newMarks ?? []) {
      const entity = units.onlyEntityWhere(ITEM_KEY, itemHash(item));
      if (!units.of(entity).get(ITEM_FLAGS).seen) continue;
      patches.push(units.of(entity).patch(ITEM_FLAGS, { seen: false }));
      added.push(`${item} new mark`);
    }

    for (const { archive, flags: written } of entry.archives ?? []) {
      const entity = units.onlyEntityWhere(ARCHIVE_KEY, hashId(archive));
      if (units.of(entity).get(ARCHIVE_FLAGS).unlocked) continue;
      patches.push(units.of(entity).patch(ARCHIVE_FLAGS, written));
      for (const counter of ARCHIVES_UNLOCKED_COUNTERS)
        progress[counter] = progress[counter]! + 1n;
      added.push(archive);
    }

    for (const feature of entry.uiFeatures ?? []) {
      if (uiFeatures[feature]) continue;
      uiFeatures[feature] = true;
      added.push(`UI feature ${feature}`);
    }

    for (const quest of entry.openedQuests ?? []) {
      const row = counterQuestIds.indexOf(quest);
      if (row === -1 || counterQuestOpened[row]) continue;
      counterQuestOpened[row] = true;
      added.push(`counter quest ${quest.toString(16)} opened`);
    }

    const replaced: number[] = [];
    for (const { key, captain, replaces } of entry.startWeapons ?? []) {
      if (fieldNoted(key)) continue;
      const inPlay = captain === captainInPlay;
      const { entity, id } = addWeapon(key, START_WEAPON_XP, 0, {
        forged: true,
        listOpened: inPlay,
      });
      startWeaponEntities.set(captain, entity);
      const wearer = units.of(captain);
      if (wearer.get(CHARACTER_OUTFIT) === OUTFIT_STARTING)
        patches.push(wearer.patch(CHARACTER_OUTFIT, OUTFIT_MAIN));
      patches.push(
        wearer.patch(
          CHARACTER_OUTFITS_OWNED,
          (wearer.get(CHARACTER_OUTFITS_OWNED) | (1 << OUTFIT_MAIN)) &
            ~(1 << OUTFIT_STARTING),
        ),
      );
      for (const old of units.entitiesWhere(WEAPON_KEY, hashId(replaces))) {
        const oldWeapon = units.of(old);
        const oldId = oldWeapon.get(WEAPON_ID);
        replaced.push(old);
        patches.push(
          oldWeapon.patch(WEAPON_ID, 0),
          oldWeapon.patch(WEAPON_KEY, undefined),
          oldWeapon.patch(WEAPON_XP, 0),
          oldWeapon.patch(WEAPON_UNCAP, 0),
          oldWeapon.replace(WEAPON_FLAGS, {}),
        );
        if (wearer.get(EQUIP_WEAPON) === oldId)
          patches.push(wearer.patch(EQUIP_WEAPON, id));
      }
      added.push(key);
    }
    for (const entity of replaced) writtenWeaponIds.set(entity, 0);

    for (const { key, xp, uncap } of entry.standInWeapons ?? []) {
      const held =
        standInEntities.get(key) ??
        units.entitiesWhere(WEAPON_KEY, hashId(key))[0];
      if (held === undefined) {
        if (fieldNoted(key)) continue;
        const { entity } = addWeapon(key, xp, uncap, { forged: true });
        standInEntities.set(key, entity);
      } else {
        if (!standInEntities.has(key) && units.of(held).get(WEAPON_XP) >= xp)
          continue;
        patches.push(
          units.of(held).patch(WEAPON_XP, xp),
          units.of(held).patch(WEAPON_UNCAP, uncap),
        );
      }
      added.push(key);
    }

    for (const { key, captain, startWeapon } of entry.fightWeapons ?? []) {
      if (fieldNoted(key)) continue;
      const { id } = addWeapon(key, FIGHT_WEAPON_XP, FIGHT_WEAPON_UNCAP, {
        forged: true,
      });
      if (captain === captainInPlay) {
        const raised =
          startWeaponEntities.get(captain) ??
          units.entitiesWhere(WEAPON_KEY, hashId(startWeapon))[0];
        if (raised !== undefined)
          patches.push(
            units.of(raised).patch(WEAPON_XP, RAISED_WEAPON_XP),
            units.of(raised).patch(WEAPON_UNCAP, RAISED_WEAPON_UNCAP),
          );
      } else {
        patches.push(units.of(captain).patch(EQUIP_WEAPON, id));
      }
      added.push(key);
    }

    if (entry.joinsId) {
      const entity = units.onlyEntityWhere(CHARACTER_KEY, hashId("PL1900"));
      const id = units.of(entity);
      const flags = id.get(CHARACTER_FLAGS);
      if (flags.joined) continue;
      const write = <T, W>(attribute: Attribute<T, W>, value: W) =>
        patches.push(id.patch(attribute, value));
      write(CHARACTER_FLAGS, { joined: true, storyPlayed: true });

      const crewLevel = Math.max(
        1,
        ...joinedCharacters(units).map(({ gear }) =>
          units.of(gear).get(CHARACTER_LEVEL),
        ),
      );
      const level = Math.min(crewLevel, ID_MAX_JOIN_LEVEL);
      const row = ID_LEVELS[level];
      if (level > id.get(CHARACTER_LEVEL) && row) {
        write(CHARACTER_XP, row[0]);
        write(CHARACTER_LEVEL, level);
        write(CHARACTER_BASE_HP, row[1]);
        write(CHARACTER_BASE_ATTACK, row[2]);
      }

      if (!flags.storyPlayed) {
        const skill = (n: string) => hashId(`AB_PL1900_${n}`);
        write(EQUIP_SKILLS, ID_EQUIPPED_SKILLS.map(skill));
        for (const n of ID_ACQUIRED_SKILLS) {
          const skillEntity = units.onlyEntityWhere(SKILL_KEY, skill(n));
          patches.push(
            units.of(skillEntity).patch(SKILL_FLAGS, { acquired: true }),
          );
        }
        const block = masteryRange(entity).first;
        for (const [offset, bits] of Object.entries(ID_MASTERY_BITS))
          patches.push(
            units.of(block + Number(offset)).patch(MASTERY_NODE_BITS, bits),
          );
        progress[STORY_MASTERY_FILLED] = 1n;
      }
      added.push("PL1900");
    }
  }

  if (added.length === 0) return added;
  for (const [item, count] of rewardItems) {
    const entity = units.onlyEntityWhere(ITEM_KEY, itemHash(item));
    const held = units.of(entity);
    patches.push(
      held.patch(ITEM_COUNT, held.get(ITEM_COUNT) + count),
      held.replace(ITEM_FLAGS, { fieldNote: true }),
    );
    if (held.get(ITEM_ACQUIRED) === 0) patches.push(stamps.stamp(entity));
  }
  patches.push(
    at.patch(TROPHY_EARNED, earned),
    at.patch(TROPHY_PROGRESS, progress),
    at.patch(UI_FEATURE_UNLOCKED, uiFeatures),
    at.patch(COUNTER_QUEST_OPENED, counterQuestOpened),
    at.patch(USER_RUPIES, rupies),
    ...stamps.done(),
    at.patch(WEAPON_LAST_ID, weaponId),
  );
  session.patch(patches);
  return added;
}
