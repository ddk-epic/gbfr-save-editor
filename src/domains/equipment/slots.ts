import { SIGIL_SLOT_PARAMS } from "../../data/masteries";
import type { FateEpisode } from "../fate-episode/read";
import type { MasteryProgress, MasterySection } from "../mastery/read";

/** Open sigil slots, as FUN_1402b5990 counts them. */
export function sigilSlots(
  character: string,
  level: number,
  fateEpisodes: readonly FateEpisode[],
  masteries: Record<MasterySection, MasteryProgress>,
): number {
  const completed = fateEpisodes.filter((episode) => episode.completed).length;
  const unlocked =
    Number(level >= 1) +
    (character === "PL2900"
      ? 0
      : Number(completed >= 5) + Number(completed >= 9));
  const mastered = Object.values(masteries)
    .flatMap((section) => section.nodes)
    .filter((node) => node.taken)
    .flatMap((node) => node.params)
    .filter((param) => SIGIL_SLOT_PARAMS.includes(param.key))
    .reduce((sum, param) => sum + param.value, 0);
  return unlocked + mastered;
}
