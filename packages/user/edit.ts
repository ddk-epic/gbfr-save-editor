import { SAVE_ENTITY, type Attribute } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  USER_MASTERY_POINTS,
  USER_MAX_MASTERY_POINTS,
  USER_MAX_RUPIES,
  USER_RUPIES,
} from "./attributes";

function maxOut(
  draft: Draft,
  attribute: Attribute<number>,
  max: number,
  name: string,
) {
  if (draft.of(SAVE_ENTITY).get(attribute) >= max)
    throw new Error(`${name} are already ${max}`);
  draft.of(SAVE_ENTITY).set(attribute, max);
}

export const maxRupies = (draft: Draft) =>
  maxOut(draft, USER_RUPIES, USER_MAX_RUPIES, "rupies");

export const maxMasteryPoints = (draft: Draft) =>
  maxOut(draft, USER_MASTERY_POINTS, USER_MAX_MASTERY_POINTS, "mastery points");
