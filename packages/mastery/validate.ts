import { reject, type Graded } from "@gbfr/core";
import type { MasteryIssue } from "./issues";
import type { MasteryProgress, MasterySection } from "./read";

export const validateMasteries = (
  character: string,
  masteries: Record<MasterySection, MasteryProgress>,
): Graded<MasteryIssue>[] =>
  Object.entries(masteries)
    .filter(([, { taken, total }]) => taken > total)
    .map(([section, { taken, total }]) =>
      reject({ code: "masteryOverTotal", character, section, taken, total }),
    );
