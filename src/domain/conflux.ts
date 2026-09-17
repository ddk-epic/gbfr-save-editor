import { CONFLUX_AURAS, CONFLUX_TREE } from "../data/conflux";
import type { UnitStore } from "../format/unit-store";
import {
  CONFLUX_AURA_OBTAINED,
  CONFLUX_AURA_SEEN,
  EMPTY_HASH,
  ID,
  UNIT,
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

/** Values of one IDType by the key hash another IDType holds at the same units. */
function byKey(
  units: UnitStore,
  keyId: number,
  valueId: number,
  valueType: "int" | "uint",
  first: number,
  count: number,
): Map<number, number> {
  const values = new Map<number, number>();
  for (let unit = first; unit < first + count; unit++) {
    const key = units.values(keyId, unit, "uint")?.[0];
    if (key === undefined || key === EMPTY_HASH) continue;
    values.set(key, units.values(valueId, unit, valueType)?.[0] ?? 0);
  }
  return values;
}

export function readConflux(units: UnitStore): Conflux {
  const bits = byKey(
    units,
    ID.PROGRESS_KEY,
    ID.PROGRESS_VALUE,
    "int",
    UNIT.CONFLUX_TREE,
    UNIT.CONFLUX_TREE_ENTRIES,
  );
  const resonance = CONFLUX_TREE.map(
    ([hash, key, bit, cost, effects]): ResonanceNode => ({
      key,
      cost,
      effects: effects.map(([param, value]) => ({ key: param, value })),
      taken: (((bits.get(hash) ?? 0) >> bit) & 1) === 1,
    }),
  );

  const flags = byKey(
    units,
    ID.CONFLUX_AURA_KEY,
    ID.CONFLUX_AURA_FLAGS,
    "uint",
    UNIT.CONFLUX_AURA,
    UNIT.CONFLUX_AURA_COUNT,
  );
  const aura = (key: string, category: number | undefined, flag = 0): Aura => ({
    key,
    category,
    obtained: (flag & CONFLUX_AURA_OBTAINED) !== 0,
    seen: (flag & CONFLUX_AURA_SEEN) !== 0,
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
    resonancePoints: units.values(ID.USER_RESONANCE_POINTS, 0, "int")?.[0] ?? 0,
    resonance,
    auras,
  };
}
