import type { Save } from "./read-save";
import type { Graded, Issue } from "./validation";

export interface ValidateContext {
  /** The latest a quest can have been cleared. */
  now: Date;
}

/** A set of checks over a save. */
export interface SaveModule<I extends Issue = Issue> {
  readonly name: string;
  validate(save: Save, context: ValidateContext): Graded<I>[];
}
