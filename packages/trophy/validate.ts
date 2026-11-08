import { warning, type Graded, type SaveModule } from "@gbfr/core";
import type { TrophyIssue } from "./issues";
import { readTrophies, type Trophy } from "./read";

export function validateTrophies(trophies: Trophy[]): Graded<TrophyIssue>[] {
  const issues: Graded<TrophyIssue>[] = [];
  for (const { key, seen, earned, dlc } of trophies) {
    if (seen && !earned)
      issues.push(warning({ code: "trophySeenNotEarned", key }));
    if (dlc === undefined)
      issues.push(warning({ code: "trophyNotInTable", key }));
  }
  return issues;
}

export const trophyModule: SaveModule<TrophyIssue> = {
  name: "trophy",
  validate: (save) => validateTrophies(readTrophies(save.slotData.units)),
};
