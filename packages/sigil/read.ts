import type { UnitEntity, Units } from "@gbfr/core";
import { TRAIT_SIGIL, readTraits, traitOrder, type Trait } from "@gbfr/trait";
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

const orderOf = (trait: Trait | undefined) =>
  trait ? traitOrder(trait.key) : Infinity;

/** Inventory order: skill.InventorySortOrder of the first trait, then of the second. */
export const compareSigils = (a: Sigil, b: Sigil) =>
  orderOf(a.primaryTrait) - orderOf(b.primaryTrait) ||
  orderOf(a.secondaryTrait) - orderOf(b.secondaryTrait);

export function readSigil(units: Units, entity: UnitEntity): Sigil | undefined {
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
export function readSigils(units: Units): Map<number, Sigil> {
  const sigils = new Map<number, Sigil>();
  for (const entity of units.entitiesWith(SIGIL_ID)) {
    const sigil = readSigil(units, entity);
    if (sigil) sigils.set(sigil.id, sigil);
  }
  return sigils;
}

export const findSigilById = (
  units: Units,
  id: number,
): UnitEntity | undefined => units.entitiesWhere(SIGIL_ID, id)[0];
