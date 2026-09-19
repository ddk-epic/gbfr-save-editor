import type { Attribute } from "../../core/attribute";
import type { EntityRange, UnitStore } from "../../core/unit-store";

/** Values of one attribute by the key hash another attribute holds at the same entity. */
export function byKey<T>(
  units: UnitStore,
  key: Attribute<number | undefined>,
  value: Attribute<T>,
  range: EntityRange,
): Map<number, T> {
  const values = new Map<number, T>();
  for (const entity of units.entitiesWith(key, range)) {
    const at = units.of(entity);
    const hash = at.get(key);
    if (hash === undefined) continue;
    values.set(hash, at.get(value));
  }
  return values;
}
