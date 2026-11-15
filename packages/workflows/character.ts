import type { UnitEntity } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { CHARACTER_KEY } from "@gbfr/character";
import {
  joinCharacter,
  lockedCharacters,
  raiseMasterLevel,
} from "@gbfr/character/edit";
import { characterLevelTrophies, masterLevelTrophies } from "@gbfr/trophy/edit";

/** Joins a Crewmate menu character at level 100 and writes its level trophies. */
export function unlockCharacter(draft: Draft, character: UnitEntity) {
  joinCharacter(draft, character);
  const key = draft.of(character).get(CHARACTER_KEY)!;
  characterLevelTrophies(draft, key);
}

/** Unlocks every Crewmate menu character not in the crew. */
export function unlockAllCharacters(draft: Draft) {
  for (const entity of lockedCharacters(draft)) unlockCharacter(draft, entity);
}

/** Sets a character to the last master level and earns its badges, no MSP spent. */
export function maxMasterLevel(draft: Draft, character: UnitEntity) {
  raiseMasterLevel(draft, character);
  const key = draft.of(character).get(CHARACTER_KEY)!;
  masterLevelTrophies(draft, key);
}
