import type { Attribute } from "../src/core/attribute";
import type { SaveUnit } from "../src/core/save-data-binary";
import { UnitStore } from "../src/core/unit-store";

/**
 * The units one entity holds, as attribute and stored values. A value that is
 * not an array stands for a unit holding that one value.
 */
export type EntityUnits = [Attribute<unknown>, unknown][];

export function unitStore(entities: Record<number, EntityUnits>): UnitStore {
  const units: SaveUnit[] = [];
  for (const [entity, pairs] of Object.entries(entities))
    for (const [attribute, values] of pairs)
      units.push({
        attribute: attribute.id,
        entity: Number(entity),
        valueType: attribute.valueType,
        values: Array.isArray(values) ? values : [values],
      } as SaveUnit);
  return new UnitStore(units);
}
