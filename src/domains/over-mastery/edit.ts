import { EMPTY_HASH } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { SaveSession } from "../../session/save-session";
import { CHARACTER_KEY, masteryRange } from "../character/attributes";
import { OVER_MASTERY_KEY, OVER_MASTERY_LEVEL } from "./attributes";
import { readOverMasteries } from "./read";

/** Empties all four lines; the game reads the character as unrolled. */
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
    lines.flatMap((_, i) => [
      {
        attribute: OVER_MASTERY_KEY,
        entity: mastery.first + i,
        values: [EMPTY_HASH],
      },
      { attribute: OVER_MASTERY_LEVEL, entity: mastery.first + i, values: [0] },
    ]),
  );
}
