import { FATE_EPISODE_CHARACTERS } from "../../data/characters";
import { keyOf } from "../../core/keys";
import type { UnitStore } from "../../core/unit-store";
import {
  FATE_EPISODES,
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
} from "./attributes";

export interface FateEpisode {
  /** fate_episode.Key */
  key: string;
  completed: boolean;
}

/** By chara.CharId, in save order. */
export function readFateEpisodes(units: UnitStore): Map<string, FateEpisode[]> {
  const byCharacter = new Map<string, FateEpisode[]>();
  for (const entity of units.entitiesWith(FATE_EPISODE_KEY)) {
    const at = units.of(entity);
    const hash = at.get(FATE_EPISODE_KEY);
    if (hash === undefined) continue;
    const key = keyOf(FATE_EPISODES, hash);
    if (key === undefined) continue;
    // Untitled episodes, REMI_*, are not in the menu.
    const character = FATE_EPISODE_CHARACTERS[hash];
    if (character === undefined) continue;
    const episodes = byCharacter.get(character) ?? [];
    episodes.push({ key, completed: at.get(FATE_EPISODE_STATE).completed });
    byCharacter.set(character, episodes);
  }
  return byCharacter;
}
