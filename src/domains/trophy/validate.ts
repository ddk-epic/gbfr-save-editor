import { warning, type SaveIssue } from "../../core/validation";
import type { Trophy } from "./read";

export function validateTrophies(trophies: Trophy[]): SaveIssue[] {
  const issues: SaveIssue[] = [];
  for (const { key, seen, earned, dlc } of trophies) {
    if (seen && !earned)
      issues.push(warning({ code: "trophySeenNotEarned", key }));
    if (dlc === undefined)
      issues.push(warning({ code: "trophyNotInTable", key }));
  }
  return issues;
}
