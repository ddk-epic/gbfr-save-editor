import type { Draft } from "@gbfr/core/draft";
import { TRAIT_KEY, TRAIT_LEVEL, traitRange } from "./attributes";

/** Sets the traits at consecutive entities from `first`. */
export function setTraits(
  draft: Draft,
  first: number,
  traits: readonly { key: string | undefined; level: number }[],
) {
  traits.forEach(({ key, level }, i) => {
    draft.of(first + i).set(TRAIT_KEY, key);
    draft.of(first + i).set(TRAIT_LEVEL, level);
  });
}

/** Empties every trait of a holder. */
export function clearTraits(draft: Draft, holder: number) {
  for (const trait of draft.entitiesWith(TRAIT_KEY, traitRange(holder))) {
    draft.of(trait).set(TRAIT_KEY, undefined);
    draft.of(trait).set(TRAIT_LEVEL, 0);
  }
}
