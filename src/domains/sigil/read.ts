import { TRAIT_INVENTORY_SORT_ORDER } from "../../data/sigils";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { TRAIT_SIGIL } from "../trait/attributes";
import { readTraits, type Trait } from "../trait/read";
import {
  SIGIL_FIRST,
  SIGIL_FLAGS,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_LEVEL,
} from "./attributes";

export interface Sigil {
  entity: UnitEntity;
  id: number;
  /** gem.Key */
  key: string;
  level: number;
  primaryTrait: Trait | undefined;
  secondaryTrait: Trait | undefined;
  locked: boolean;
  /** False while the game marks the sigil as new. */
  seen: boolean;
}

const traitOrder = (trait: Trait | undefined) =>
  (trait && TRAIT_INVENTORY_SORT_ORDER[trait.key]) ?? Infinity;

/** Inventory order: skill.InventorySortOrder of the first trait, then of the second. */
export const compareSigils = (a: Sigil, b: Sigil) =>
  traitOrder(a.primaryTrait) - traitOrder(b.primaryTrait) ||
  traitOrder(a.secondaryTrait) - traitOrder(b.secondaryTrait);

export function readSigil(
  units: UnitStore,
  entity: UnitEntity,
): Sigil | undefined {
  const at = units.of(entity);
  const id = at.get(SIGIL_ID);
  const key = at.get(SIGIL_KEY);
  if (!id || key === undefined) return undefined;
  const [primaryTrait, secondaryTrait] = readTraits(
    units,
    TRAIT_SIGIL + entity - SIGIL_FIRST,
  );
  return {
    entity,
    id,
    key,
    level: at.get(SIGIL_LEVEL),
    primaryTrait,
    secondaryTrait,
    ...at.get(SIGIL_FLAGS),
  };
}

/** By sigil id. */
export function readSigils(units: UnitStore): Map<number, Sigil> {
  const sigils = new Map<number, Sigil>();
  for (const entity of units.entitiesWith(SIGIL_ID)) {
    const sigil = readSigil(units, entity);
    if (sigil) sigils.set(sigil.id, sigil);
  }
  return sigils;
}

export const findSigilById = (
  units: UnitStore,
  id: number,
): UnitEntity | undefined => units.entitiesWhere(SIGIL_ID.id, id)[0];
