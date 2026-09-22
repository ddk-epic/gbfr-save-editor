import { duplicates, warning, type SaveIssue } from "../../core/validation";
import type { FateEpisode } from "./read";

export const validateFateEpisodes = (
  character: string,
  episodes: FateEpisode[],
): SaveIssue[] =>
  duplicates(episodes.map((episode) => episode.key)).map((key) =>
    warning({ code: "duplicateFateEpisode", character, key }),
  );
