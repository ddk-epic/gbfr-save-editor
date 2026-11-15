import type { Save } from "@gbfr/core";
import { hasLockedTips } from "@gbfr/journal";
import { HINT_TIPS, hasUnshownHints } from "@gbfr/tutorial";

/** True on a save with a found hint not marked as shown. */
export const canClearHints = (save: Save) =>
  hasUnshownHints(save.slotData.units) ||
  hasLockedTips(save.slotData.units, HINT_TIPS);
