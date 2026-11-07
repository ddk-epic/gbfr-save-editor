import { duplicates, warning, type Graded } from "../../core/validation";
import type { FateEpisodeIssue } from "./issues";
import type { FateEpisode } from "./read";

export const validateFateEpisodes = (
  character: string,
  episodes: FateEpisode[],
): Graded<FateEpisodeIssue>[] =>
  duplicates(episodes.map((episode) => episode.key)).map((key) =>
    warning({ code: "duplicateFateEpisode", character, key }),
  );
