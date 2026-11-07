import type { UnitEntity } from "../core/save-data-binary";
import type { SaveSession } from "../core/session";
import { CHARACTER_KEY } from "../domains/character/attributes";
import {
  joinCharacter,
  lockedCharacters,
  maxMasterLevelPatches,
} from "../domains/character/edit";
import {
  characterLevelTrophies,
  masterLevelTrophies,
} from "../domains/trophy/edit";

/** Joins a Crewmate menu character at level 100 and writes its level trophies. */
export function unlockCharacter(session: SaveSession, character: UnitEntity) {
  const units = session.save.slotData.units;
  joinCharacter(session, character);
  const key = units.of(character).get(CHARACTER_KEY)!;
  session.patch(characterLevelTrophies(units, key));
}

/** Unlocks every Crewmate menu character not in the crew. */
export function unlockAllCharacters(session: SaveSession) {
  const units = session.save.slotData.units;
  for (const entity of lockedCharacters(units))
    unlockCharacter(session, entity);
}

/** Sets a character to the last master level and earns its badges, no MSP spent. */
export function maxMasterLevel(session: SaveSession, character: UnitEntity) {
  const units = session.save.slotData.units;
  const patches = maxMasterLevelPatches(units, character);
  const key = units.of(character).get(CHARACTER_KEY)!;
  session.patch([...patches, ...masterLevelTrophies(units, key)]);
}
