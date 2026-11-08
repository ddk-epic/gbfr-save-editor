import { reject, type Graded } from "@gbfr/core";
import type { WrightstoneIssue } from "./issues";
import type { Wrightstone } from "./read";

/** A main trait and two sub traits. */
export const WRIGHTSTONE_MAX_TRAITS = 3;

/** Trait count and descending order of one stone; order is checked on loose stones only. */
export function validateWrightstone(
  holder: "wrightstone" | "weapon",
  id: number,
  { traits }: Wrightstone,
): Graded<WrightstoneIssue>[] {
  const issues: Graded<WrightstoneIssue>[] = [];
  if (traits.length > WRIGHTSTONE_MAX_TRAITS)
    issues.push(
      reject({
        code: "tooManyTraits",
        holder,
        id,
        count: traits.length,
        max: WRIGHTSTONE_MAX_TRAITS,
      }),
    );
  if (
    holder === "wrightstone" &&
    traits.some((trait, i) => i > 0 && trait.level > traits[i - 1]!.level)
  )
    issues.push(reject({ code: "traitsNotDescending", holder, id }));
  return issues;
}
