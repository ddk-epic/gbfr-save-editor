import type { UnitStore } from "../../core/unit-store";
import { ABILITY_FLAGS, ABILITY_KEY, ABILITY_SEEN } from "./attributes";

/**
 * ability.Key of abilities in a character's list not yet seen, guest
 * characters included. Abilities a character has not got hold 0 and are left out.
 */
export function readUnseenAbilities(units: UnitStore): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(ABILITY_KEY)) {
    const at = units.of(entity);
    const key = at.get(ABILITY_KEY);
    // A zero word means the character has not got the ability at all, so the
    // seen bit says nothing about it.
    const flags = at.get(ABILITY_FLAGS);
    if (key !== undefined && flags !== 0 && (flags & ABILITY_SEEN) === 0)
      keys.push(key);
  }
  return keys;
}
