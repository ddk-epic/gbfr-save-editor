import {
  MASTERY_BONUSES,
  MASTERY_NODES,
  MASTERY_PARAM_VALUES,
  MASTERY_SECTIONS,
  REPLACED_TRANSCENDENCE,
} from "../../data/masteries";
import { SaveFormatError } from "../../core/errors";
import type { UnitEntity } from "../../core/save-data-binary";
import type { EntityRange, UnitStore } from "../../core/unit-store";
import { UNLOCK_KEY, UNLOCK_VALUE } from "../unlock/attributes";

export type MasterySection = (typeof MASTERY_SECTIONS)[number];

export interface MasteryNode {
  /** limit_bonus.Key */
  key: string;
  /** ap_tree NodeGridLocation. */
  grid: number;
  msp: number;
  taken: boolean;
  /** The unit holding the node's ladder, and the node's bit in it. */
  entity: UnitEntity | undefined;
  bit: number;
  /** limit_bonus_param effects of the node, each with its value as displayed. */
  params: MasteryEffect[];
}

export interface MasteryEffect {
  /** limit_bonus_param.Key */
  key: string;
  /** Lv{n}Value at LimitBonusParamIndex n - 1; the T1-6 value (Lv9Value) on T7 transcendence. */
  value: number;
  /** T7 transcendence bonus over the T1-6 value (Lv10Value), shown as <d>+{1}<d>. */
  bonus?: number;
}

export interface MasteryProgress {
  /** Nodes taken. */
  taken: number;
  /** Nodes in the section; transcendence counts the T7 rows only. */
  total: number;
  /** MspCost of the nodes taken. */
  msp: number;
  /** The section's nodes by grid location; T1-6 transcendence rows only when taken. */
  nodes: MasteryNode[];
}

export function readMasteries(
  units: UnitStore,
  mastery: EntityRange,
  character: string,
): Record<MasterySection, MasteryProgress> {
  const progress = Object.fromEntries(
    MASTERY_SECTIONS.map((section): [MasterySection, MasteryProgress] => [
      section,
      { taken: 0, total: 0, msp: 0, nodes: [] },
    ]),
  ) as Record<MasterySection, MasteryProgress>;
  const nodes = MASTERY_NODES[character];
  if (!nodes) return progress;

  const takenBits = new Map<number, number>();
  const ladderEntity = new Map<number, UnitEntity>();
  for (const entity of units.entitiesWith(UNLOCK_KEY, mastery)) {
    const at = units.of(entity);
    const hash = at.get(UNLOCK_KEY);
    if (hash === undefined) continue;
    const ladder = nodes[hash];
    if (!ladder) continue;
    // Low byte: bit n is the node at LimitBonusParamIndex n. The second byte
    // flags a subset of those and has no meaning assigned.
    const bits = at.get(UNLOCK_VALUE) & 0xff;
    ladder.forEach((node, index) => {
      if (bits & (1 << index) && !node)
        throw new SaveFormatError({
          code: "unusedMasteryBit",
          entity,
          bit: index,
        });
    });
    takenBits.set(hash, bits);
    ladderEntity.set(hash, entity);
  }

  for (const [hash, ladder] of Object.entries(nodes)) {
    const [key, ...params] = MASTERY_BONUSES[Number(hash)]!;
    const bits = takenBits.get(Number(hash)) ?? 0;
    ladder.forEach((node, index) => {
      if (!node) return;
      const [section, msp, grid] = node;
      const taken = !!(bits & (1 << index));
      const replaced = section === REPLACED_TRANSCENDENCE;
      if (replaced && !taken) return;
      const sectionProgress =
        progress[
          MASTERY_SECTIONS[
            replaced ? MASTERY_SECTIONS.indexOf("transcendence") : section
          ]!
        ];
      if (!replaced) sectionProgress.total++;
      if (taken) {
        sectionProgress.taken++;
        sectionProgress.msp += msp;
      }
      sectionProgress.nodes.push({
        key: key!,
        grid,
        msp,
        taken,
        entity: ladderEntity.get(Number(hash)),
        bit: index,
        params: params.map((param): MasteryEffect => {
          const values = MASTERY_PARAM_VALUES[param]!;
          return section === MASTERY_SECTIONS.indexOf("transcendence")
            ? { key: param, value: values[8]!, bonus: values[9]! }
            : { key: param, value: values[index]! };
        }),
      });
    });
  }
  for (const sectionProgress of Object.values(progress))
    sectionProgress.nodes.sort((a, b) => a.grid - b.grid);
  return progress;
}
