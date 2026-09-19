import { GEM_TRAITS } from "../../data/sigils";
import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { GEMS } from "../sigil/attributes";
import { ITEMS } from "../wrightstone/attributes";
import {
  CURIO_KEY,
  CURIO_REWARD_ENTRIES,
  CURIO_REWARD_KEY,
  CURIO_REWARD_LEVEL,
  CURIO_REWARD_SEED,
  CURIO_SERIAL,
} from "./attributes";

/** A curio's reward, rolled when the curio is found. */
export type CurioReward =
  | { type: "material"; /** item.Key */ key: string }
  | {
      type: "sigil";
      /** gem.Key */ key: string;
      level: number;
      /** The sigil's own traits, skill.Key of gem.SkillId1 then SkillId2. */
      traits: string[];
      /** Seed of the trait the sigil rolls at appraisal, 0 on a gem with two. */
      seed: number;
    }
  | { type: "wrightstone"; /** item.Key */ key: string; seed: number };

export interface Curio {
  entity: UnitEntity;
  /** item.Key of the curio tier, ITEM_19_0001-0004. */
  key: string;
  /** 1-4, the tier in the item.Key; undefined when the key is unresolved. */
  tier: number | undefined;
  /** Its number in the order curios were found, counting up across the save. */
  serial: number;
  reward: CurioReward | undefined;
}

function readCurioReward(
  units: UnitStore,
  curioEntity: UnitEntity,
): CurioReward | undefined {
  for (let entry = 0; entry < CURIO_REWARD_ENTRIES; entry++) {
    const at = units.of(curioEntity * 100 + entry);
    const hash = at.get(CURIO_REWARD_KEY);
    const seed = at.get(CURIO_REWARD_SEED);
    if (entry === 1) {
      const key = keyOf(GEMS, hash);
      if (key === undefined) continue;
      return {
        type: "sigil",
        key,
        level: at.get(CURIO_REWARD_LEVEL),
        traits: [...(GEM_TRAITS[key] ?? [])],
        seed,
      };
    }
    const key = keyOf(ITEMS, hash);
    if (key === undefined) continue;
    return entry === 3
      ? { type: "wrightstone", key, seed }
      : { type: "material", key };
  }
  return undefined;
}

/** Curios held, oldest first, the order the game appraises them in. */
export function readCurios(units: UnitStore): Curio[] {
  const curios: Curio[] = [];
  for (const entity of units.entitiesWith(CURIO_KEY)) {
    const at = units.of(entity);
    const key = at.get(CURIO_KEY);
    if (key === undefined) continue;
    const tier = /^ITEM_19_000(\d)$/.exec(key)?.[1];
    curios.push({
      entity,
      key,
      tier: tier === undefined ? undefined : Number(tier),
      serial: at.get(CURIO_SERIAL),
      reward: readCurioReward(units, entity),
    });
  }
  return curios;
}
