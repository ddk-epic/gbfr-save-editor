import type { Attribute } from "../../core/attribute";
import type { UnitStore } from "../../core/unit-store";

/** The one entity holding `hash` in `attribute`. */
export function onlyEntity(
  units: UnitStore,
  attribute: Attribute<unknown>,
  hash: number,
) {
  const found = units.entitiesWhere(attribute, hash);
  if (found.length !== 1)
    throw new Error(`${found.length} units of ${attribute.id} hold ${hash}`);
  return found[0]!;
}
