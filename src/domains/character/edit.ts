import type { UnitEntity } from "../../core/save-data-binary";
import { CHARACTER_MAX_STATS } from "../../data/characters";
import type { SaveSession } from "../../save/session";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MAX_LEVEL,
  CHARACTER_MAX_XP,
  CHARACTER_XP,
} from "./attributes";

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
