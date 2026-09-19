import type { UnitStore } from "../../core/unit-store";
import {
  ABILITY_ACQUIRED,
  ABILITY_FLAGS,
  ABILITY_KEY,
  ABILITY_SEEN,
} from "./attributes";

/** ability.Key of acquired abilities not yet seen, guest characters included. */
export function readUnseenAbilities(units: UnitStore): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(ABILITY_KEY)) {
    const at = units.of(entity);
    const key = at.get(ABILITY_KEY);
    const flags = at.get(ABILITY_FLAGS);
    if (
      key !== undefined &&
      (flags & ABILITY_ACQUIRED) !== 0 &&
      (flags & ABILITY_SEEN) === 0
    )
      keys.push(key);
  }
  return keys;
}
