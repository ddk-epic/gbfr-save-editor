import type { Save } from "../../core/read-save";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import {
  ACCOUNT_MASTER_LEVEL_BADGES,
  CHARACTER_LEVEL_BADGES,
  CHARACTER_MAX_STATS,
  CREW_LEVEL_BADGES,
  UNLOCKABLE_CHARACTERS,
  LAST_RAISED_LEVEL_BADGES,
  MASTER_LEVEL_BADGE_QUANTITIES,
  MASTER_LEVEL_BADGES,
  MASTER_LEVEL_MSP,
} from "../../data/characters";
import type { Patch, SaveSession } from "../../core/session";
import {
  CREW_LEVEL_TOTAL,
  LAST_RAISED_LEVEL,
  TROPHY_CHARACTER_LEVEL,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../trophy/attributes";
import { trophyLedger } from "../trophy/ledger";
import { SAVE_ENTITY } from "../../core/save-entity";
import { recountHeldWeapons } from "../weapon/edit";
import { offPlayCaptain } from "../weapon/read";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FLAGS,
  CHARACTER_JOINED,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_BREAK_MARKS,
  CHARACTER_MASTER_BREAK_NEW,
  CHARACTER_MASTER_XP,
  CHARACTER_MAX_LEVEL,
  CHARACTER_MAX_XP,
  CHARACTER_XP,
} from "./attributes";
import { masterLevelOf } from "./read";

export const MAX_MASTER_LEVEL = MASTER_LEVEL_MSP.length - 1;
const MASTER_LEVEL_CAP = 50;
/** 1305; a crew member has bit 0 without bit 1. */
const JOINED_MASK = 3;

/** False for NPCs and unused rows. */
export const characterLevels = (character: string) =>
  character in CHARACTER_MAX_STATS;

/** Sets a character to level 100 with the level 100 base HP and ATK. */
export function maxCharacterLevel(session: SaveSession, character: UnitEntity) {
  const units = session.save.slotData.units;
  const key = units.of(character).get(CHARACTER_KEY);
  const stats = key === undefined ? undefined : CHARACTER_MAX_STATS[key];
  if (stats === undefined)
    throw new Error(`character ${character} has no max level`);
  if (units.of(character).get(CHARACTER_LEVEL) >= CHARACTER_MAX_LEVEL)
    throw new Error(
      `character ${character} is already level ${CHARACTER_MAX_LEVEL}`,
    );

  session.patch([
    { attribute: CHARACTER_XP, entity: character, values: [CHARACTER_MAX_XP] },
    {
      attribute: CHARACTER_LEVEL,
      entity: character,
      values: [CHARACTER_MAX_LEVEL],
    },
    { attribute: CHARACTER_BASE_HP, entity: character, values: [stats.hp] },
    {
      attribute: CHARACTER_BASE_ATTACK,
      entity: character,
      values: [stats.attack],
    },
  ]);
}

/** True for a Crewmate menu character not in the crew. */
export function canUnlockCharacter(units: UnitStore, character: UnitEntity) {
  const at = units.of(character);
  const key = at.get(CHARACTER_KEY);
  return (
    key !== undefined &&
    UNLOCKABLE_CHARACTERS.includes(key) &&
    characterLevels(key) &&
    (at.get(CHARACTER_FLAGS) & CHARACTER_JOINED) === 0
  );
}

/** Summed levels of the crew, the off-play captain left out. */
const crewLevelTotal = (units: UnitStore) => {
  const offPlay = offPlayCaptain(units);
  return units
    .entitiesWith(CHARACTER_KEY)
    .filter((entity) => {
      const at = units.of(entity);
      return (
        (at.get(CHARACTER_FLAGS) & JOINED_MASK) === CHARACTER_JOINED &&
        at.get(CHARACTER_KEY) !== offPlay
      );
    })
    .reduce(
      (total, entity) => total + units.of(entity).get(CHARACTER_LEVEL),
      0,
    );
};

/** Joins a Crewmate menu character at level 100 and writes its level trophies. */
export function unlockCharacter(session: SaveSession, character: UnitEntity) {
  const units = session.save.slotData.units;
  if (!canUnlockCharacter(units, character))
    throw new Error(`character ${character} cannot be unlocked`);
  const at = units.of(character);
  const key = at.get(CHARACTER_KEY)!;
  const stats = CHARACTER_MAX_STATS[key]!;
  session.patch([
    {
      attribute: CHARACTER_FLAGS,
      entity: character,
      values: [at.get(CHARACTER_FLAGS) | CHARACTER_JOINED],
    },
    { attribute: CHARACTER_XP, entity: character, values: [CHARACTER_MAX_XP] },
    {
      attribute: CHARACTER_LEVEL,
      entity: character,
      values: [CHARACTER_MAX_LEVEL],
    },
    { attribute: CHARACTER_BASE_HP, entity: character, values: [stats.hp] },
    {
      attribute: CHARACTER_BASE_ATTACK,
      entity: character,
      values: [stats.attack],
    },
  ]);

  const { index, progress, badges } = CHARACTER_LEVEL_BADGES[key]!;
  const crewCap = CREW_LEVEL_BADGES.at(-1)![1];
  const ledger = trophyLedger(units);
  ledger.setTiers(progress, CHARACTER_MAX_LEVEL, badges);
  ledger.setTiers(
    CREW_LEVEL_TOTAL,
    Math.min(crewLevelTotal(units), crewCap),
    CREW_LEVEL_BADGES,
  );
  ledger.setTiers(
    LAST_RAISED_LEVEL,
    CHARACTER_MAX_LEVEL,
    LAST_RAISED_LEVEL_BADGES,
  );
  recountHeldWeapons(units, ledger);
  const levels = [...units.of(SAVE_ENTITY).get(TROPHY_CHARACTER_LEVEL)];
  levels[index] = CHARACTER_MAX_LEVEL;
  session.patch([
    {
      attribute: TROPHY_PROGRESS,
      entity: SAVE_ENTITY,
      values: ledger.progress,
    },
    { attribute: TROPHY_EARNED, entity: SAVE_ENTITY, values: ledger.earned },
    {
      attribute: TROPHY_CHARACTER_LEVEL,
      entity: SAVE_ENTITY,
      values: levels,
    },
  ]);
}

/** Crewmate menu characters not in the crew. */
export const lockedCharacters = (units: UnitStore) =>
  units
    .entitiesWith(CHARACTER_KEY)
    .filter((entity) => canUnlockCharacter(units, entity));

export const canUnlockAllCharacters = (save: Save) =>
  lockedCharacters(save.slotData.units).length > 0;

/** Unlocks every Crewmate menu character not in the crew. */
export function unlockAllCharacters(session: SaveSession) {
  const units = session.save.slotData.units;
  for (const entity of lockedCharacters(units))
    unlockCharacter(session, entity);
}

/** False for characters with no master level badges. */
export const characterMasterLevels = (character: string) =>
  character in MASTER_LEVEL_BADGES;

/** Sets a character to the last master level and earns its badges, no MSP spent. */
export function maxMasterLevel(session: SaveSession, character: UnitEntity) {
  const units = session.save.slotData.units;
  const at = units.of(character);
  const key = at.get(CHARACTER_KEY);
  const badges = key === undefined ? undefined : MASTER_LEVEL_BADGES[key];
  if (badges === undefined)
    throw new Error(`character ${character} has no master level`);
  if (masterLevelOf(at.get(CHARACTER_MASTER_XP)) >= MAX_MASTER_LEVEL)
    throw new Error(
      `character ${character} is already master level ${MAX_MASTER_LEVEL}`,
    );

  const earned = [...units.of(SAVE_ENTITY).get(TROPHY_EARNED)];
  const progress = [...units.of(SAVE_ENTITY).get(TROPHY_PROGRESS)];
  // ReqQuantity 1 badges write no progress.
  for (const [badge, behavior, quantity] of [
    ...badges.map(
      ([key, progress], i) =>
        [key, progress, MASTER_LEVEL_BADGE_QUANTITIES[i]!] as const,
    ),
    ...ACCOUNT_MASTER_LEVEL_BADGES,
  ]) {
    earned[badge] = true;
    if (quantity > 1 && progress[behavior]! < BigInt(quantity))
      progress[behavior] = BigInt(quantity);
  }
  const breaks = MAX_MASTER_LEVEL - MASTER_LEVEL_CAP;
  const patches: Patch[] = [
    {
      attribute: CHARACTER_MASTER_XP,
      entity: character,
      values: [MASTER_LEVEL_MSP[MAX_MASTER_LEVEL]!],
    },
    {
      attribute: CHARACTER_FLAGS,
      entity: character,
      values: [at.get(CHARACTER_FLAGS) | CHARACTER_MASTER_BREAK_NEW],
    },
    {
      attribute: CHARACTER_MASTER_BREAK_MARKS,
      entity: character,
      values: at.get(CHARACTER_MASTER_BREAK_MARKS).map((m) => m || breaks),
    },
    { attribute: TROPHY_EARNED, entity: SAVE_ENTITY, values: earned },
    { attribute: TROPHY_PROGRESS, entity: SAVE_ENTITY, values: progress },
  ];
  session.patch(patches);
}
