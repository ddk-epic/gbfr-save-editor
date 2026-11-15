import type { UnitEntity, Units } from "@gbfr/core";
import { TRAIT_KEY, TRAIT_LEVEL, traitRange } from "./attributes";
import { TRAIT_INVENTORY_SORT_ORDER } from "./data.gen";

/** skill.InventorySortOrder of a trait, last when it has none. */
export const traitOrder = (key: string) =>
  TRAIT_INVENTORY_SORT_ORDER[key] ?? Infinity;

export interface Trait {
  entity: UnitEntity;
  /** skill.Key */
  key: string;
  level: number;
}

export function readTraits(
  units: Units,
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

export const readFilledTraits = (units: Units, holder: number): Trait[] =>
  readTraits(units, holder).filter(
    (trait): trait is Trait => trait !== undefined,
  );
