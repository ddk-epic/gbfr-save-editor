import { reject, warning, type SaveIssue } from "../../core/validation";
import type { Conflux } from "./read";

export function validateConflux(conflux: Conflux): SaveIssue[] {
  const issues: SaveIssue[] = [];
  if (conflux.resonancePoints < 0)
    issues.push(
      reject({
        code: "negativeResonancePoints",
        points: conflux.resonancePoints,
      }),
    );
  // The first node is the root; every other node hangs off it.
  const [root, ...rest] = conflux.resonance;
  if (root && !root.taken && rest.some((node) => node.taken))
    issues.push(reject({ code: "resonanceRootNotTaken" }));
  for (const aura of conflux.auras) {
    if (aura.seen && !aura.obtained)
      issues.push(warning({ code: "auraSeenNotObtained", key: aura.key }));
    if (aura.category === undefined)
      issues.push(warning({ code: "auraNotInTable", key: aura.key }));
  }
  return issues;
}
