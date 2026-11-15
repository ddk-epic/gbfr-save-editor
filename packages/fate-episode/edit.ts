import type { UnitEntity } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { FATE_EPISODE_STATE } from "./attributes";

/** Marks an episode completed; a locked one also gains revealed, an open one keeps its own. */
export function completeEpisode(draft: Draft, entity: UnitEntity) {
  const at = draft.of(entity);
  const state = at.get(FATE_EPISODE_STATE);
  at.set(FATE_EPISODE_STATE, {
    locked: false,
    started: true,
    completed: true,
    revealed: state.locked || state.revealed,
  });
}
