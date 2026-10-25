import type { Attribute } from "../../core/attribute";
import type { SaveSession } from "../../save/session";
import {
  SAVE_ENTITY,
  USER_MASTERY_POINTS,
  USER_MAX_MASTERY_POINTS,
  USER_MAX_RUPIES,
  USER_RUPIES,
} from "./attributes";

function maxOut(
  session: SaveSession,
  attribute: Attribute<number>,
  max: number,
  name: string,
) {
  if (session.save.slotData.units.of(SAVE_ENTITY).get(attribute) >= max)
    throw new Error(`${name} are already ${max}`);
  session.patch([{ attribute, entity: SAVE_ENTITY, values: [max] }]);
}

export const maxRupies = (session: SaveSession) =>
  maxOut(session, USER_RUPIES, USER_MAX_RUPIES, "rupies");

export const maxMasteryPoints = (session: SaveSession) =>
  maxOut(
    session,
    USER_MASTERY_POINTS,
    USER_MAX_MASTERY_POINTS,
    "mastery points",
  );
