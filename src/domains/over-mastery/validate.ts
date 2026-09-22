import { reject, type SaveIssue } from "../../core/validation";
import type { OverMastery } from "./read";

export const OVER_MASTERY_MAX_LEVEL = 10;

/** A level below 1 does not read at all; the reader throws on it. */
export const validateOverMasteries = (
  character: string,
  lines: (OverMastery | undefined)[],
): SaveIssue[] =>
  lines
    .filter((line): line is OverMastery => !!line)
    .filter((line) => line.level > OVER_MASTERY_MAX_LEVEL)
    .map(({ entity, level }) =>
      reject({ code: "overMasteryOverMax", character, entity, level }),
    );
