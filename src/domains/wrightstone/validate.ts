import { reject, type SaveIssue } from "../../core/validation";
import type { Wrightstone } from "./read";

/** A main trait and two sub traits. */
export const WRIGHTSTONE_MAX_TRAITS = 3;

/**
 * `holder` is where the stone sits and `id` that holder's id. The game rolls a
 * stone's traits in descending level. A stone welded onto a weapon keeps its
 * traits in the weapon's own list, so their order is only checked on loose
 * stones.
 */
export function validateWrightstone(
  holder: "wrightstone" | "weapon",
  id: number,
  { traits }: Wrightstone,
): SaveIssue[] {
  const issues: SaveIssue[] = [];
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
