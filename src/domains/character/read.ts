import { CHARACTER_UI_ORDER, MASTER_LEVEL_MSP } from "../../data/characters";
import { hashId } from "../../core/xxhash32-custom";
import type { EntityRange, UnitStore } from "../../core/unit-store";
import type { UnitEntity } from "../../core/save-data-binary";
import { CHARACTER_FIRST, CHARACTER_KEY, masteryRange } from "./attributes";

/** NP rows: Lyria, Vyrn, Sierokarte, Rolan, Historiath, Zathba. */
export const isNPC = (character: string) => /^NP\d{4}$/.test(character);

/** Rows no save should use: empty party positions, the LookDev rig, Id's second form. */
export const isUnused = (character: string) =>
  /^SLOT\d{2}$/.test(character) ||
  character === "PL000B" ||
  character === "PL2000";

/** Gran and Djeeta, in the order 1103 numbers them from 1. */
export const CAPTAINS = ["PL0000", "PL0100"] as const;
export type Captain = (typeof CAPTAINS)[number];

/** The captain the save did not pick. Unknown when the save names no captain. */
export const isUnchosenCaptain = (
  character: string,
  captain: Captain | undefined,
) =>
  captain !== undefined &&
  (CAPTAINS as readonly string[]).includes(character) &&
  character !== captain;

/** chara.UIOrder: playable, then NPCs, empty positions and dev rows; unresolved keys last. */
export const characterOrder = (character: string) =>
  CHARACTER_UI_ORDER[character] ?? Infinity;

export function masterLevelOf(xp: number): number {
  let level = 0;
  while (
    level + 1 < MASTER_LEVEL_MSP.length &&
    MASTER_LEVEL_MSP[level + 1]! <= xp
  )
    level++;
  return level;
}

/** A character sits at two coordinates: its gear entity and its mastery range. */
export interface CharacterEntities {
  gear: UnitEntity;
  mastery: EntityRange;
}

export const characterAt = (gear: UnitEntity): CharacterEntities => ({
  gear,
  mastery: masteryRange(gear),
});

/** In gear entity order. */
export const characterEntities = (units: UnitStore): CharacterEntities[] =>
  units.entitiesWith(CHARACTER_KEY).map(characterAt);

export function findCharacter(
  units: UnitStore,
  character: string,
): CharacterEntities | undefined {
  const gear = units.entitiesWhere(CHARACTER_KEY, hashId(character), {
    first: CHARACTER_FIRST,
    count: 1000,
  })[0];
  return gear === undefined ? undefined : characterAt(gear);
}
