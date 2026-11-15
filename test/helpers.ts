import { draft, type Draft } from "../packages/core/draft";
import type { SaveSession } from "../packages/core/session";
import { storyDifficulty } from "../packages/story";
import { advanceStory } from "../packages/story/edit";

/** Commits what `build` drafts and returns its result. */
export function apply<T>(session: SaveSession, build: (draft: Draft) => T): T {
  const pending = draft(session.save.slotData.units);
  const result = build(pending);
  session.commit(pending);
  return result;
}

/** Advances the session's story to checkpoint `id`. */
export const advance = (session: SaveSession, id: string, now?: number) =>
  apply(session, (draft) =>
    advanceStory(draft, id, storyDifficulty(session.save), now),
  );
