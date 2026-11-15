import type { Draft } from "@gbfr/core/draft";
import { gainItem, loseItem } from "@gbfr/item/edit";
import { newWrightstone, rerollWrightstone } from "@gbfr/wrightstone/edit";
import type { WrightstoneRoll } from "@gbfr/wrightstone";

/** Adds an unlocked, unseen stone to the inventory; returns its id. */
export function addWrightstone(draft: Draft, roll: WrightstoneRoll) {
  const { id, key } = newWrightstone(draft, roll);
  gainItem(draft, key);
  return id;
}

/** Rerolls an inventory stone by id. */
export function editWrightstone(
  draft: Draft,
  id: number,
  roll: WrightstoneRoll,
) {
  const { previous, key } = rerollWrightstone(draft, id, roll);
  if (key === previous) return;
  loseItem(draft, previous);
  gainItem(draft, key);
}
