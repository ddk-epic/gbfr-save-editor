import type { UnitStore } from "@gbfr/core";
import type { Patch } from "@gbfr/core/session";
import { TRAIT_KEY, TRAIT_LEVEL, traitRange } from "./attributes";

/** Sets the traits at consecutive entities from `first`. */
export function setTraits(
  units: UnitStore,
  first: number,
  traits: readonly { key: string | undefined; level: number }[],
): Patch[] {
  return traits.flatMap(({ key, level }, i) => [
    units.of(first + i).patch(TRAIT_KEY, key),
    units.of(first + i).patch(TRAIT_LEVEL, level),
  ]);
}

/** Empties every trait of a holder. */
export function clearTraits(units: UnitStore, holder: number): Patch[] {
  return units
    .entitiesWith(TRAIT_KEY, traitRange(holder))
    .flatMap((trait) => [
      units.of(trait).patch(TRAIT_KEY, undefined),
      units.of(trait).patch(TRAIT_LEVEL, 0),
    ]);
}
