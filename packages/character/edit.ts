import type { Save, UnitEntity, Units } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  CHARACTER_MAX_STATS,
  UNLOCKABLE_CHARACTERS,
  MASTER_LEVEL_CHARACTERS,
  MASTER_LEVEL_MSP,
} from "./data.gen";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_FLAGS,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_BREAK_MARKS,
  CHARACTER_MASTER_XP,
  CHARACTER_MAX_LEVEL,
  CHARACTER_MAX_XP,
  CHARACTER_XP,
} from "./attributes";
import { masterLevelOf } from "./read";

export const MAX_MASTER_LEVEL = MASTER_LEVEL_MSP.length - 1;
const MASTER_LEVEL_CAP = 50;

/** False for NPCs and unused rows. */
export const characterLevels = (character: string) =>
  character in CHARACTER_MAX_STATS;

/** Sets a character to level 100 with the level 100 base HP and ATK. */
export function maxCharacterLevel(draft: Draft, character: UnitEntity) {
  const key = draft.of(character).get(CHARACTER_KEY);
  const stats = key === undefined ? undefined : CHARACTER_MAX_STATS[key];
  if (stats === undefined)
    throw new Error(`character ${character} has no max level`);
  if (draft.of(character).get(CHARACTER_LEVEL) >= CHARACTER_MAX_LEVEL)
    throw new Error(
      `character ${character} is already level ${CHARACTER_MAX_LEVEL}`,
    );

  const at = draft.of(character);
  at.set(CHARACTER_XP, CHARACTER_MAX_XP);
  at.set(CHARACTER_LEVEL, CHARACTER_MAX_LEVEL);
  at.set(CHARACTER_BASE_HP, stats.hp);
  at.set(CHARACTER_BASE_ATTACK, stats.attack);
}

/** True for a Crewmate menu character not in the crew. */
export function canUnlockCharacter(units: Units, character: UnitEntity) {
  const at = units.of(character);
  const key = at.get(CHARACTER_KEY);
  return (
    key !== undefined &&
    UNLOCKABLE_CHARACTERS.includes(key) &&
    characterLevels(key) &&
    !at.get(CHARACTER_FLAGS).joined
  );
}

/** Joins a Crewmate menu character at level 100. */
export function joinCharacter(draft: Draft, character: UnitEntity) {
  if (!canUnlockCharacter(draft, character))
    throw new Error(`character ${character} cannot be unlocked`);
  const at = draft.of(character);
  const stats = CHARACTER_MAX_STATS[at.get(CHARACTER_KEY)!]!;
  at.set(CHARACTER_FLAGS, { joined: true });
  at.set(CHARACTER_XP, CHARACTER_MAX_XP);
  at.set(CHARACTER_LEVEL, CHARACTER_MAX_LEVEL);
  at.set(CHARACTER_BASE_HP, stats.hp);
  at.set(CHARACTER_BASE_ATTACK, stats.attack);
}

/** Crewmate menu characters not in the crew. */
export const lockedCharacters = (units: Units) =>
  units
    .entitiesWith(CHARACTER_KEY)
    .filter((entity) => canUnlockCharacter(units, entity));

export const canUnlockAllCharacters = (save: Save) =>
  lockedCharacters(save.slotData.units).length > 0;

/** False for characters with no master level badges. */
export const characterMasterLevels = (character: string) =>
  MASTER_LEVEL_CHARACTERS.includes(character);

/** Sets a character to the last master level, no MSP spent. */
export function raiseMasterLevel(draft: Draft, character: UnitEntity) {
  const at = draft.of(character);
  const key = at.get(CHARACTER_KEY);
  if (key === undefined || !MASTER_LEVEL_CHARACTERS.includes(key))
    throw new Error(`character ${character} has no master level`);
  if (masterLevelOf(at.get(CHARACTER_MASTER_XP)) >= MAX_MASTER_LEVEL)
    throw new Error(
      `character ${character} is already master level ${MAX_MASTER_LEVEL}`,
    );

  const breaks = MAX_MASTER_LEVEL - MASTER_LEVEL_CAP;
  at.set(CHARACTER_MASTER_XP, MASTER_LEVEL_MSP[MAX_MASTER_LEVEL]!);
  at.set(CHARACTER_FLAGS, { masterBreakNew: true });
  at.set(
    CHARACTER_MASTER_BREAK_MARKS,
    at.get(CHARACTER_MASTER_BREAK_MARKS).map((m) => m || breaks),
  );
}
