import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { TRAIT_KEY, TRAIT_LEVEL, traitRange } from "./attributes";

export interface Trait {
  entity: UnitEntity;
  /** skill.Key */
  key: string;
  level: number;
}

export function readTraits(
  units: UnitStore,
  holder: number,
): (Trait | undefined)[] {
  return units.entitiesWith(TRAIT_KEY, traitRange(holder)).map((entity) => {
    const at = units.of(entity);
    const key = at.get(TRAIT_KEY);
    return key === undefined
      ? undefined
      : { entity, key, level: at.get(TRAIT_LEVEL) };
  });
}

export const readFilledTraits = (units: UnitStore, holder: number): Trait[] =>
  readTraits(units, holder).filter(
    (trait): trait is Trait => trait !== undefined,
  );
