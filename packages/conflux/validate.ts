import { reject, warning, type Graded, type SaveModule } from "@gbfr/core";
import type { ConfluxIssue } from "./issues";
import { readConflux, type Conflux } from "./read";

export function validateConflux(conflux: Conflux): Graded<ConfluxIssue>[] {
  const issues: Graded<ConfluxIssue>[] = [];
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

export const confluxModule: SaveModule<ConfluxIssue> = {
  name: "conflux",
  validate: (save) => validateConflux(readConflux(save.slotData.units)),
};
