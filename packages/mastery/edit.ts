import type { UnitEntity } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { MASTERY_NODE_BITS } from "./attributes";

/** Sets the node bits of the entities at offsets into the block starting at `first`. */
export function setMasteryNodeBits(
  draft: Draft,
  first: UnitEntity,
  bitsByOffset: Readonly<Record<number, number>>,
) {
  for (const [offset, bits] of Object.entries(bitsByOffset))
    draft.of(first + Number(offset)).set(MASTERY_NODE_BITS, bits);
}
