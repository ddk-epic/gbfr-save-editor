import {
  MASTER_TRAIT_VALUES,
  MASTER_TRAIT_VALUE_SCALES,
  SKILLBOARD_CELLS,
} from "../../data/master-traits";
import { keyOf } from "../../core/keys";
import type { EntityRange, UnitStore } from "../../core/unit-store";
import { UNLOCK_KEY, UNLOCK_VALUE } from "../unlock/attributes";
import { SKILLBOARD_EFFECTS } from "./attributes";

export interface MasterTrait {
  /** skillboard_effect.Key */
  key: string;
  /** skillboard_category: SB_DEF Insight, SB_ATK Essence, SB_LIMIT Crux. */
  style: string;
  rank: "r1" | "r2" | "r3" | "ex";
  /** skillboard_layout Unk30, the cell's place on the board. */
  order: number;
  /** A style perk: named at r1, upgraded at r2 and r3. */
  perk: boolean;
  chosen: boolean;
  /** Numbers for {0}-{29} in the trait's text, as the archive stores them. */
  values: readonly number[];
  /** What each value is multiplied by to display it, 1 past the list. */
  valueScales: readonly number[];
}

const MASTER_TRAIT_STYLES = ["SB_DEF", "SB_ATK", "SB_LIMIT"];
const MASTER_TRAIT_RANKS = ["r1", "r2", "r3", "ex"];

/** Every board cell, by style, rank, perks first, then board order. */
export function readMasterTraits(
  units: UnitStore,
  mastery: EntityRange,
): MasterTrait[] {
  const cells: MasterTrait[] = [];
  for (const entity of units.entitiesWith(UNLOCK_KEY, mastery)) {
    const at = units.of(entity);
    const hash = at.get(UNLOCK_KEY);
    const cell = hash === undefined ? undefined : SKILLBOARD_CELLS[hash];
    if (cell === undefined) continue;
    const [style, rank, order, perk] = cell;
    const key = keyOf(SKILLBOARD_EFFECTS, hash)!;
    cells.push({
      key,
      style,
      rank,
      order,
      perk,
      chosen: at.get(UNLOCK_VALUE) === 1,
      values: MASTER_TRAIT_VALUES[key] ?? [],
      valueScales: MASTER_TRAIT_VALUE_SCALES[key] ?? [],
    });
  }
  const sortKey = (c: MasterTrait) => [
    MASTER_TRAIT_STYLES.indexOf(c.style),
    MASTER_TRAIT_RANKS.indexOf(c.rank),
    c.perk ? 0 : 1,
    c.order,
  ];
  return cells.sort((a, b) => {
    const [ka, kb] = [sortKey(a), sortKey(b)];
    const i = ka.findIndex((n, j) => n !== kb[j]);
    return i === -1 ? 0 : ka[i]! - kb[i]!;
  });
}
