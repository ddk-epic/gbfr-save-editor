import { CONFLUX_AURAS, CONFLUX_TREE } from "../data/conflux";
import type { Attribute } from "../format/attribute";
import type { UnitStore } from "../format/unit-store";
import {
  CONFLUX_AURA_FLAGS,
  CONFLUX_AURA_KEY,
  PROGRESS_KEY,
  PROGRESS_VALUE,
  SAVE_WIDE,
  UNIT,
  USER_RESONANCE_POINTS,
} from "./layout";

export interface ResonanceEffect {
  /** `limit_bonus_param.Key`. */
  key: string;
  /** The param's value at the node's bit, the {0} of its text. */
  value: number;
}

export interface ResonanceNode {
  /** `limit_bonus.Key` of the node's bonus. */
  key: string;
  /** Resonance points the node costs. */
  cost: number;
  effects: ResonanceEffect[];
  taken: boolean;
}

export interface Aura {
  /** `endlessmode_buff.Unk105`, "#" and 8 hex digits for a key the table lacks. */
  key: string;
  /** `endlessmode_buff.Unk109`, 0 Vitality to 8 Chaos, undefined for a key the table lacks. */
  category: number | undefined;
  obtained: boolean;
  /** New mark cleared. */
  seen: boolean;
}

export interface Conflux {
  resonancePoints: number;
  /** Every Resonance tree node in table order. */
  resonance: ResonanceNode[];
  /** Every aura in collection order, obtained or not. */
  auras: Aura[];
}

/** Values of one attribute by the key hash another attribute holds at the same entity. */
function byKey<T>(
  units: UnitStore,
  key: Attribute<number | undefined>,
  value: Attribute<T>,
  range: { first: number; count: number },
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

export function readConflux(units: UnitStore): Conflux {
  const bits = byKey(units, PROGRESS_KEY, PROGRESS_VALUE, {
    first: UNIT.CONFLUX_TREE,
    count: UNIT.CONFLUX_TREE_ENTRIES,
  });
  const resonance = CONFLUX_TREE.map(
    ([hash, key, bit, cost, effects]): ResonanceNode => ({
      key,
      cost,
      effects: effects.map(([param, value]) => ({ key: param, value })),
      taken: (((bits.get(hash) ?? 0) >> bit) & 1) === 1,
    }),
  );

  const flags = byKey(units, CONFLUX_AURA_KEY, CONFLUX_AURA_FLAGS, {
    first: UNIT.CONFLUX_AURA,
    count: UNIT.CONFLUX_AURA_COUNT,
  });
  const aura = (
    key: string,
    category: number | undefined,
    flag?: { obtained: boolean; seen: boolean },
  ): Aura => ({
    key,
    category,
    obtained: flag?.obtained ?? false,
    seen: flag?.seen ?? false,
  });
  const auras = CONFLUX_AURAS.map(([hash, key, category]) => {
    const flag = flags.get(hash);
    flags.delete(hash);
    return aura(key, category, flag);
  });
  // A key the table does not hold, after a game update.
  for (const [hash, flag] of flags)
    auras.push(aura(`#${hash.toString(16).padStart(8, "0")}`, undefined, flag));

  return {
    resonancePoints: units.of(SAVE_WIDE).get(USER_RESONANCE_POINTS),
    resonance,
    auras,
  };
}
