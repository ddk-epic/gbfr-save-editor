import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import {
  ABILITIES,
  EQUIP_SKILLS,
  SKILL_ACQUIRED,
  SKILL_FLAGS,
  SKILL_KEY,
  SKILL_POSITIONS,
  SKILL_SEEN,
} from "./attributes";

/** ability.Key of acquired skills not yet seen, guest characters included. */
export function readUnseenSkills(units: UnitStore): string[] {
  const keys: string[] = [];
  for (const entity of units.entitiesWith(SKILL_KEY)) {
    const at = units.of(entity);
    const key = at.get(SKILL_KEY);
    const flags = at.get(SKILL_FLAGS);
    if (
      key !== undefined &&
      (flags & SKILL_ACQUIRED) !== 0 &&
      (flags & SKILL_SEEN) === 0
    )
      keys.push(key);
  }
  return keys;
}

export function readEquippedSkills(
  units: UnitStore,
  entity: UnitEntity,
): (string | undefined)[] {
  const skills = units.of(entity).get(EQUIP_SKILLS);
  return Array.from({ length: SKILL_POSITIONS }, (_, i) =>
    keyOf(ABILITIES, skills[i]),
  );
}
