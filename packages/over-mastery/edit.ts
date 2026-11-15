import type { UnitEntity } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { CHARACTER_KEY, masteryRange } from "@gbfr/character";
import { OVER_MASTERY_KEY, OVER_MASTERY_LEVEL } from "./attributes";
import { readOverMasteries } from "./read";

/** Empties all four Over Mastery lines. */
export function removeOverMasteries(draft: Draft, character: UnitEntity) {
  if (draft.of(character).get(CHARACTER_KEY) === undefined)
    throw new Error(`no character at ${character}`);
  const mastery = masteryRange(character);
  const lines = readOverMasteries(draft, mastery);
  if (lines.every((line) => line === undefined))
    throw new Error(`character ${character} has no Over Mastery`);

  lines.forEach((_, i) => {
    const line = draft.of(mastery.first + i);
    line.set(OVER_MASTERY_KEY, undefined);
    line.set(OVER_MASTERY_LEVEL, 0);
  });
}
