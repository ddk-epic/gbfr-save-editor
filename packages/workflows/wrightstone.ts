import type { SaveSession } from "@gbfr/core/session";
import { gainItem, loseItem } from "@gbfr/item/edit";
import { newWrightstone, rerollWrightstone } from "@gbfr/wrightstone/edit";
import type { WrightstoneRoll } from "@gbfr/wrightstone";

/** Adds an unlocked, unseen stone to the inventory; returns its id. */
export function addWrightstone(session: SaveSession, roll: WrightstoneRoll) {
  const units = session.save.slotData.units;
  const { id, key, patches } = newWrightstone(units, roll);
  session.patch([...patches, ...gainItem(units, key)]);
  return id;
}

/** Rerolls an inventory stone by id. */
export function editWrightstone(
  session: SaveSession,
  id: number,
  roll: WrightstoneRoll,
) {
  const units = session.save.slotData.units;
  const { previous, key, patches } = rerollWrightstone(units, id, roll);
  session.patch([
    ...patches,
    ...(key === previous
      ? []
      : [...loseItem(units, previous), ...gainItem(units, key)]),
  ]);
}
