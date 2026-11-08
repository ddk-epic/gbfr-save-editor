import { reject, type Graded } from "@gbfr/core";
import type { MasterTraitIssue } from "./issues";
import type { MasterTrait } from "./read";

/** Cells the board pays out per rank; perks have no pool. */
export const MASTER_TRAIT_POOLS: Record<MasterTrait["rank"], number> = {
  r1: 10,
  r2: 10,
  r3: 10,
  ex: 20,
};

export function validateMasterTraits(
  character: string,
  traits: MasterTrait[],
): Graded<MasterTraitIssue>[] {
  const chosen = traits.filter((trait) => trait.chosen && !trait.perk);
  return Object.entries(MASTER_TRAIT_POOLS).flatMap(([rank, pool]) => {
    const count = chosen.filter((trait) => trait.rank === rank).length;
    return count > pool
      ? [
          reject({
            code: "masterTraitPool",
            character,
            rank,
            chosen: count,
            pool,
          }),
        ]
      : [];
  });
}
