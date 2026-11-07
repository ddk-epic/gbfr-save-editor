import { SaveFormatError } from "../core/errors";
import type { SaveModule, ValidateContext } from "../core/module";
import type { Save } from "../core/read-save";
import { containerModule } from "../core/validate-container";
import { reject, type Graded } from "../core/validation";
import { confluxModule } from "../domains/conflux/validate";
import { journalModule } from "../domains/journal/validate";
import { sideQuestModule } from "../domains/quest/validate";
import { trophyModule } from "../domains/trophy/validate";
import {
  characterModule,
  inventoryModule,
  counterQuestModule,
} from "./cross-validate";
import type { SaveFormatIssue, ValidationIssue } from "./issues";

/** The checks `validateSave` runs by default, in the order their issues are listed. */
export const SAVE_MODULES: readonly SaveModule[] = [
  containerModule,
  characterModule,
  inventoryModule,
  confluxModule,
  trophyModule,
  sideQuestModule,
  counterQuestModule,
  journalModule,
];

export interface ValidateOptions extends Partial<ValidateContext> {
  /** The checks to run; defaults to `SAVE_MODULES`. */
  modules?: readonly SaveModule[];
}

/** Checks claims every save holds; a reader's SaveFormatError returns as a reject. */
export function validateSave(
  save: Save,
  { now = new Date(), modules = SAVE_MODULES }: ValidateOptions = {},
): Graded<ValidationIssue | SaveFormatIssue>[] {
  return modules.flatMap((module) => {
    try {
      return module.validate(save, { now }) as Graded<
        ValidationIssue | SaveFormatIssue
      >[];
    } catch (error) {
      if (error instanceof SaveFormatError)
        return [reject(error.issue) as Graded<SaveFormatIssue>];
      throw error;
    }
  });
}
