import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { SKILLS } from "../trait/attributes";
import type { Trait } from "../trait/read";
import {
  SUMMONS_EQUIPPED,
  SUMMON_BASE_PARAMS,
  SUMMON_FLAGS,
  SUMMON_ID,
  SUMMON_KEY,
  SUMMON_LEVELS,
  SUMMON_POSITIONS,
  SUMMON_TRAIT_AND_BONUS,
} from "./attributes";

export interface EquipBonus {
  /** summon_base_param.Key */
  key: string;
  /** 0-9, reads summon_base_param.Level<level + 1>Value. */
  level: number;
}

export interface Summon {
  /** summon.Key */
  key: string;
  trait: Trait | undefined;
  equipBonus: EquipBonus | undefined;
  /** Equipped at least once. */
  everEquipped: boolean;
  /** False while the game marks the summon as new. */
  seen: boolean;
}

export function readSummon(
  units: UnitStore,
  entity: UnitEntity,
): Summon | undefined {
  const at = units.of(entity);
  const id = at.get(SUMMON_ID);
  const key = at.get(SUMMON_KEY);
  if (!id || key === undefined) return undefined;

  const [traitHash, bonusHash] = at.get(SUMMON_TRAIT_AND_BONUS);
  const [traitLevel = 0, bonusLevel = 0] = at.get(SUMMON_LEVELS);
  const traitKey = keyOf(SKILLS, traitHash);
  const bonusKey = keyOf(SUMMON_BASE_PARAMS, bonusHash);
  return {
    key,
    trait:
      traitKey === undefined ? undefined : { key: traitKey, level: traitLevel },
    equipBonus:
      bonusKey === undefined ? undefined : { key: bonusKey, level: bonusLevel },
    ...at.get(SUMMON_FLAGS),
  };
}

/** By summon id. */
export function readSummons(units: UnitStore): Map<number, Summon> {
  const summons = new Map<number, Summon>();
  for (const entity of units.entitiesWith(SUMMON_ID)) {
    const summon = readSummon(units, entity);
    if (summon) summons.set(units.of(entity).get(SUMMON_ID), summon);
  }
  return summons;
}

export function readEquippedSummons(
  units: UnitStore,
  held: Map<number, Summon>,
): (Summon | undefined)[] {
  const equipped = units.of(0).get(SUMMONS_EQUIPPED);
  return Array.from({ length: SUMMON_POSITIONS }, (_, i) => {
    const id = equipped[i];
    return id ? held.get(id) : undefined;
  });
}
