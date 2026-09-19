import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { TRAIT_WRIGHTSTONE } from "../trait/attributes";
import { readFilledTraits, type Trait } from "../trait/read";
import {
  WRIGHTSTONE_FIRST,
  WRIGHTSTONE_FLAGS,
  WRIGHTSTONE_ID,
  WRIGHTSTONE_KEY,
  WRIGHTSTONE_LOCKED,
} from "./attributes";

export interface Wrightstone {
  /** item.Key */
  key: string;
  /** Main trait, then the two sub traits. */
  traits: Trait[];
}

export interface InventoryWrightstone extends Wrightstone {
  locked: boolean;
  /** False while the game marks the stone as new. */
  seen: boolean;
}

export function readWrightstone(
  units: UnitStore,
  entity: UnitEntity,
): InventoryWrightstone | undefined {
  const at = units.of(entity);
  const key = at.get(WRIGHTSTONE_KEY);
  const id = at.get(WRIGHTSTONE_ID);
  if (!id || key === undefined) return undefined;
  return {
    key,
    traits: readFilledTraits(
      units,
      TRAIT_WRIGHTSTONE + entity - WRIGHTSTONE_FIRST,
    ),
    locked: at.get(WRIGHTSTONE_LOCKED),
    seen: at.get(WRIGHTSTONE_FLAGS).seen,
  };
}

/** By wrightstone id. */
export function readWrightstones(
  units: UnitStore,
): Map<number, InventoryWrightstone> {
  const stones = new Map<number, InventoryWrightstone>();
  for (const entity of units.entitiesWith(WRIGHTSTONE_KEY)) {
    const stone = readWrightstone(units, entity);
    if (stone) stones.set(units.of(entity).get(WRIGHTSTONE_ID), stone);
  }
  return stones;
}
