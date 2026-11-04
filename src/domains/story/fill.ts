import type { Attribute } from "../../core/attribute";
import { EMPTY_HASH } from "../../core/keys";
import { hashId } from "../../core/xxhash32-custom";
import type { Patch, SaveSession } from "../../save/session";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FLAGS,
  CHARACTER_JOINED,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_STORY_PLAYED,
  CHARACTER_XP,
  masteryRange,
} from "../character/attributes";
import { joinedCharacters } from "../character/read";
import { EQUIP_WEAPON } from "../equipment/attributes";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../item/attributes";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
} from "../journal/attributes";
import { MASTERY_NODE_BITS } from "../mastery/attributes";
import {
  EQUIP_SKILLS,
  SKILL_ACQUIRED,
  SKILL_FLAGS,
  SKILL_KEY,
} from "../skill/attributes";
import {
  ARCHIVES_UNLOCKED_COUNTERS,
  CHAPTER_KEYS_CLEARED,
  STORY_MASTERY_FILLED,
  TROPHIES_EARNED_IN_RANGE,
  TROPHIES_EARNED_OUTSIDE_RANGE,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  TROPHY_RANGE_FIRST,
  TROPHY_RANGE_LAST,
} from "../trophy/attributes";
import { SAVE_ENTITY, USER_CAPTAIN } from "../user/attributes";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_XP,
} from "../weapon/attributes";
import { CURRENT_CHAPTER, UI_FEATURE_UNLOCKED } from "./attributes";
import { onlyEntity } from "./only-entity";

const STORY_ITEM = 4;
const KEY_ITEM = 36;
const ARCHIVE_UNLOCKED_SEEN = 3;
const ARCHIVE_UNLOCKED = 1;
const STORY_WEAPON_FLAGS = 128;
const WEAPON_OWNED_BIT = 1;
const START_WEAPON_XP = 90;
const RAISED_WEAPON_XP = 1740;
const RAISED_WEAPON_UNCAP = 3;
const FIGHT_WEAPON_XP = 162540;
const FIGHT_WEAPON_UNCAP = 6;
const FIELD_NOTE_REGISTERED = 4;
const WEAPON_ENTRIES = 256;

interface StoryFillEntry {
  /** `chapter_select.Key` of the chapter start the entry is due by. */
  key: number;
  /** `badge.Key`. */
  trophies: readonly number[];
  chapterKeysCleared: bigint;
  items?: readonly { item: string; flags: number }[];
  archives?: readonly { archive: string; flags: number }[];
  uiFeatures?: readonly number[];
  startWeapons?: readonly { key: string; captain: number; replaces: string }[];
  fightWeapons?: readonly {
    key: string;
    captain: number;
    startWeapon: string;
  }[];
  joinsId?: boolean;
}

/** In story order. */
const STORY_FILL: readonly StoryFillEntry[] = [
  {
    key: 40,
    trophies: [1, 1405],
    chapterKeysCleared: 4n,
    uiFeatures: [7],
  },
  {
    key: 60,
    trophies: [2, 1406],
    chapterKeysCleared: 6n,
    items: [{ item: "ITEM_70_0004", flags: STORY_ITEM }],
  },
  {
    key: 80,
    trophies: [3, 1407],
    chapterKeysCleared: 9n,
    items: [{ item: "ITEM_70_0005", flags: STORY_ITEM }],
    archives: [{ archive: "ARC_OTHER_011", flags: ARCHIVE_UNLOCKED }],
    startWeapons: [
      { key: "WEP_PL0000_03", captain: 10000, replaces: "WEP_PL0000_01" },
      { key: "WEP_PL0100_03", captain: 10001, replaces: "WEP_PL0100_01" },
    ],
  },
  {
    key: 100,
    trophies: [4, 1408],
    chapterKeysCleared: 13n,
  },
  {
    key: 120,
    trophies: [5, 1409],
    chapterKeysCleared: 18n,
  },
  {
    key: 140,
    trophies: [6, 1410],
    chapterKeysCleared: 22n,
  },
  {
    key: 160,
    trophies: [7, 1411],
    chapterKeysCleared: 26n,
    items: [{ item: "ITEM_70_0006", flags: STORY_ITEM }],
    archives: [
      { archive: "ARC_OTHER_026", flags: ARCHIVE_UNLOCKED },
      { archive: "ARC_OTHER_058", flags: ARCHIVE_UNLOCKED },
      { archive: "ARC_OTHER_059", flags: ARCHIVE_UNLOCKED },
      { archive: "ARC_OTHER_060", flags: ARCHIVE_UNLOCKED },
    ],
  },
  {
    key: 180,
    trophies: [8, 1412],
    chapterKeysCleared: 30n,
    fightWeapons: [
      { key: "WEP_PL0000_99", captain: 10000, startWeapon: "WEP_PL0000_03" },
      { key: "WEP_PL0100_99", captain: 10001, startWeapon: "WEP_PL0100_03" },
    ],
  },
  {
    key: 200,
    trophies: [9, 1413],
    chapterKeysCleared: 36n,
    items: [{ item: "ITEM_70_0010", flags: KEY_ITEM }],
    archives: [{ archive: "ARC_ROLANNOTE_08", flags: ARCHIVE_UNLOCKED_SEEN }],
  },
  {
    key: 220,
    trophies: [11, 1397],
    chapterKeysCleared: 38n,
    uiFeatures: [0, 1, 2, 3, 4, 5, 6],
    joinsId: true,
  },
];

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

/** Adds what the chapters up to the save's current one should have left, and returns what it added. */
export function fillSkippedStory(session: SaveSession): string[] {
  const units = session.save.slotData.units;
  const at = units.of(SAVE_ENTITY);
  const reached = at.get(CURRENT_CHAPTER)[0]!;
  const due = STORY_FILL.filter(({ key }) => key <= reached);
  const patches: Patch[] = [];
  const added: string[] = [];

  const earned = [...at.get(TROPHY_EARNED)];
  const progress = [...at.get(TROPHY_PROGRESS)];
  const uiFeatures = [...at.get(UI_FEATURE_UNLOCKED)];
  let acquired = at.get(ITEM_ACQUIRED_LAST);
  let weaponId = at.get(WEAPON_LAST_ID);
  let weaponEntity = WEAPON_FIRST;
  const captainInPlay = at.get(USER_CAPTAIN) === 2 ? 10001 : 10000;
  const startWeaponEntities = new Map<number, number>();
  const fieldNoted = (key: string) =>
    Number(
      units.values(
        FIELD_NOTE_WEAPON_FLAGS,
        onlyEntity(units, FIELD_NOTE_WEAPON_KEY, hashId(key)),
      )![0],
    ) !== 0;
  const addWeapon = (key: string, xp: number, uncap: number, flags: number) => {
    while (units.of(weaponEntity).get(WEAPON_ID) !== 0) {
      weaponEntity++;
      if (weaponEntity >= WEAPON_FIRST + WEAPON_ENTRIES)
        throw new Error("no free weapon entry");
    }
    weaponId++;
    const entity = weaponEntity++;
    const hash = hashId(key);
    patches.push(
      { attribute: WEAPON_ID, entity, values: [weaponId] },
      { attribute: WEAPON_KEY, entity, values: [hash] },
      { attribute: WEAPON_XP, entity, values: [xp] },
      { attribute: WEAPON_UNCAP, entity, values: [uncap] },
      { attribute: WEAPON_FLAGS, entity, values: [flags] },
      {
        attribute: FIELD_NOTE_WEAPON_FLAGS,
        entity: onlyEntity(units, FIELD_NOTE_WEAPON_KEY, hash),
        values: [FIELD_NOTE_REGISTERED],
      },
    );
    return { entity, id: weaponId };
  };

  for (const entry of due) {
    for (const trophy of entry.trophies) {
      if (earned[trophy]) continue;
      earned[trophy] = true;
      const counter =
        trophy >= TROPHY_RANGE_FIRST && trophy <= TROPHY_RANGE_LAST
          ? TROPHIES_EARNED_IN_RANGE
          : TROPHIES_EARNED_OUTSIDE_RANGE;
      progress[counter] = progress[counter]! + 1n;
      added.push(`trophy ${trophy}`);
    }
    if (entry.chapterKeysCleared > progress[CHAPTER_KEYS_CLEARED]!)
      progress[CHAPTER_KEYS_CLEARED] = entry.chapterKeysCleared;

    for (const { item, flags } of entry.items ?? []) {
      const entity = onlyEntity(units, ITEM_KEY, hashId(item));
      if (units.of(entity).get(ITEM_ACQUIRED) !== 0) continue;
      acquired++;
      patches.push(
        { attribute: ITEM_COUNT, entity, values: [1] },
        { attribute: ITEM_FLAGS, entity, values: [flags] },
        { attribute: ITEM_ACQUIRED, entity, values: [acquired] },
      );
      added.push(item);
    }

    for (const { archive, flags: written } of entry.archives ?? []) {
      const entity = onlyEntity(units, ARCHIVE_KEY, hashId(archive));
      const flags = Number(units.values(ARCHIVE_FLAGS, entity)![0]);
      if (flags & ARCHIVE_UNLOCKED) continue;
      patches.push({
        attribute: ARCHIVE_FLAGS,
        entity,
        values: [flags | written],
      });
      for (const counter of ARCHIVES_UNLOCKED_COUNTERS)
        progress[counter] = progress[counter]! + 1n;
      added.push(archive);
    }

    for (const feature of entry.uiFeatures ?? []) {
      if (uiFeatures[feature]) continue;
      uiFeatures[feature] = true;
      added.push(`UI feature ${feature}`);
    }

    for (const { key, captain, replaces } of entry.startWeapons ?? []) {
      if (fieldNoted(key)) continue;
      const inPlay = captain === captainInPlay;
      const { entity, id } = addWeapon(
        key,
        START_WEAPON_XP,
        0,
        inPlay ? STORY_WEAPON_FLAGS | WEAPON_OWNED_BIT : STORY_WEAPON_FLAGS,
      );
      startWeaponEntities.set(captain, entity);
      for (const old of units.entitiesWhere(WEAPON_KEY, hashId(replaces))) {
        const oldId = units.of(old).get(WEAPON_ID);
        patches.push(
          { attribute: WEAPON_ID, entity: old, values: [0] },
          { attribute: WEAPON_KEY, entity: old, values: [EMPTY_HASH] },
          { attribute: WEAPON_XP, entity: old, values: [0] },
          { attribute: WEAPON_UNCAP, entity: old, values: [0] },
          { attribute: WEAPON_FLAGS, entity: old, values: [0] },
        );
        if (units.of(captain).get(EQUIP_WEAPON) === oldId)
          patches.push({
            attribute: EQUIP_WEAPON,
            entity: captain,
            values: [id],
          });
      }
      added.push(key);
    }

    for (const { key, captain, startWeapon } of entry.fightWeapons ?? []) {
      if (fieldNoted(key)) continue;
      const { id } = addWeapon(
        key,
        FIGHT_WEAPON_XP,
        FIGHT_WEAPON_UNCAP,
        STORY_WEAPON_FLAGS,
      );
      if (captain === captainInPlay) {
        const raised =
          startWeaponEntities.get(captain) ??
          units.entitiesWhere(WEAPON_KEY, hashId(startWeapon))[0];
        if (raised !== undefined)
          patches.push(
            {
              attribute: WEAPON_XP,
              entity: raised,
              values: [RAISED_WEAPON_XP],
            },
            {
              attribute: WEAPON_UNCAP,
              entity: raised,
              values: [RAISED_WEAPON_UNCAP],
            },
          );
      } else {
        patches.push({
          attribute: EQUIP_WEAPON,
          entity: captain,
          values: [id],
        });
      }
      added.push(key);
    }

    if (entry.joinsId) {
      const entity = onlyEntity(units, CHARACTER_KEY, hashId("PL1900"));
      const id = units.of(entity);
      const flags = Number(id.get(CHARACTER_FLAGS));
      if (flags & CHARACTER_JOINED) continue;
      const write = (
        attribute: Attribute<unknown>,
        values: readonly unknown[],
      ) => patches.push({ attribute, entity, values });
      write(CHARACTER_FLAGS, [
        flags | CHARACTER_JOINED | CHARACTER_STORY_PLAYED,
      ]);

      const crewLevel = Math.max(
        1,
        ...joinedCharacters(units).map(({ gear }) =>
          units.of(gear).get(CHARACTER_LEVEL),
        ),
      );
      const level = Math.min(crewLevel, ID_MAX_JOIN_LEVEL);
      const row = ID_LEVELS[level];
      if (level > id.get(CHARACTER_LEVEL) && row) {
        write(CHARACTER_XP, [row[0]]);
        write(CHARACTER_LEVEL, [level]);
        write(CHARACTER_BASE_HP, [row[1]]);
        write(CHARACTER_BASE_ATTACK, [row[2]]);
      }

      if (!(flags & CHARACTER_STORY_PLAYED)) {
        const skill = (n: string) => hashId(`AB_PL1900_${n}`);
        write(EQUIP_SKILLS, ID_EQUIPPED_SKILLS.map(skill));
        for (const n of ID_ACQUIRED_SKILLS) {
          const skillEntity = onlyEntity(units, SKILL_KEY, skill(n));
          patches.push({
            attribute: SKILL_FLAGS,
            entity: skillEntity,
            values: [
              Number(units.of(skillEntity).get(SKILL_FLAGS)) | SKILL_ACQUIRED,
            ],
          });
        }
        const block = masteryRange(entity).first;
        for (const [offset, bits] of Object.entries(ID_MASTERY_BITS))
          patches.push({
            attribute: MASTERY_NODE_BITS,
            entity: block + Number(offset),
            values: [bits],
          });
        progress[STORY_MASTERY_FILLED] = 1n;
      }
      added.push("PL1900");
    }
  }

  if (added.length === 0) return added;
  patches.push(
    { attribute: TROPHY_EARNED, entity: SAVE_ENTITY, values: earned },
    { attribute: TROPHY_PROGRESS, entity: SAVE_ENTITY, values: progress },
    { attribute: UI_FEATURE_UNLOCKED, entity: SAVE_ENTITY, values: uiFeatures },
    { attribute: ITEM_ACQUIRED_LAST, entity: SAVE_ENTITY, values: [acquired] },
    { attribute: WEAPON_LAST_ID, entity: SAVE_ENTITY, values: [weaponId] },
  );
  session.patch(patches);
  return added;
}
