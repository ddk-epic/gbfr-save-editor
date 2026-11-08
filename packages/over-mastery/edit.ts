import type { UnitEntity } from "@gbfr/core";
import type { SaveSession } from "@gbfr/core/session";
import { CHARACTER_KEY, masteryRange } from "@gbfr/character";
import { OVER_MASTERY_KEY, OVER_MASTERY_LEVEL } from "./attributes";
import { readOverMasteries } from "./read";

/** Empties all four Over Mastery lines. */
export function removeOverMasteries(
  session: SaveSession,
  character: UnitEntity,
) {
  const units = session.save.slotData.units;
  if (units.of(character).get(CHARACTER_KEY) === undefined)
    throw new Error(`no character at ${character}`);
  const mastery = masteryRange(character);
  const lines = readOverMasteries(units, mastery);
  if (lines.every((line) => line === undefined))
    throw new Error(`character ${character} has no Over Mastery`);

  session.patch(
    lines.flatMap((_, i) => {
      const line = units.of(mastery.first + i);
      return [
        line.patch(OVER_MASTERY_KEY, undefined),
        line.patch(OVER_MASTERY_LEVEL, 0),
      ];
    }),
  );
}
