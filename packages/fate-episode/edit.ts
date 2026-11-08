import type { UnitEntity, UnitStore } from "@gbfr/core";
import type { Patch } from "@gbfr/core/session";
import { FATE_EPISODE_STATE } from "./attributes";

/** Marks an episode completed; a locked one also gains revealed, an open one keeps its own. */
export function completeEpisode(units: UnitStore, entity: UnitEntity): Patch {
  const at = units.of(entity);
  const state = at.get(FATE_EPISODE_STATE);
  return at.patch(FATE_EPISODE_STATE, {
    locked: false,
    started: true,
    completed: true,
    revealed: state.locked || state.revealed,
  });
}
