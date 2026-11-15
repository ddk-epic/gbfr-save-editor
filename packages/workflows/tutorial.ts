import type { Draft } from "@gbfr/core/draft";
import { unlockTips } from "@gbfr/journal/edit";
import { HINT_TIPS } from "@gbfr/tutorial";
import { showHints } from "@gbfr/tutorial/edit";

/** Marks every found hint as shown, at any point in the story. */
export function clearHints(draft: Draft) {
  showHints(draft);
  unlockTips(draft, HINT_TIPS);
}
