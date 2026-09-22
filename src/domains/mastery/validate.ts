import { reject, type SaveIssue } from "../../core/validation";
import type { MasteryProgress, MasterySection } from "./read";

export const validateMasteries = (
  character: string,
  masteries: Record<MasterySection, MasteryProgress>,
): SaveIssue[] =>
  Object.entries(masteries)
    .filter(([, { taken, total }]) => taken > total)
    .map(([section, { taken, total }]) =>
      reject({ code: "masteryOverTotal", character, section, taken, total }),
    );
