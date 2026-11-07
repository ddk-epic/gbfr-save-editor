import type { Save } from "../../core/read-save";
import type { UnitStore } from "../../core/unit-store";
import type { Patch, SaveSession } from "../../core/session";
import { SAVE_ENTITY } from "../../core/save-entity";
import {
  INVENTORY_TABS,
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAG_BITS,
  ITEM_FLAGS,
  ITEM_KEY,
} from "./attributes";
import { itemTab } from "./read";

const TREASURE_CAP = 999;
const KNICKKNACK_VOUCHER_CAP = 99999;
const KNICKKNACK_VOUCHER = "ITEM_21_0000";
const CURIO_PREFIX = "ITEM_19_";
const CARD_PREFIX = "ITEM_23_";
const PLAIN_CARD = "ITEM_23_0000";
const PLAIN_CARD_COUNT = 99;
const CHARACTER_CARD_COUNT = 1;
const INVENTORY_TAB_FIRST = 1;

function treasureTarget(key: string): number | undefined {
  if (itemTab(key) !== "treasures" || key.startsWith(CURIO_PREFIX))
    return undefined;
  if (key === KNICKKNACK_VOUCHER) return KNICKKNACK_VOUCHER_CAP;
  if (key === PLAIN_CARD) return PLAIN_CARD_COUNT;
  if (key.startsWith(CARD_PREFIX)) return CHARACTER_CARD_COUNT;
  return TREASURE_CAP;
}

function treasuresBelowTarget(units: UnitStore) {
  return units.entitiesWith(ITEM_KEY).flatMap((entity) => {
    const at = units.of(entity);
    const key = at.get(ITEM_KEY);
    const target = key === undefined ? undefined : treasureTarget(key);
    return target !== undefined && at.get(ITEM_COUNT) < target
      ? [{ entity, target }]
      : [];
  });
}

/** True on a save with a treasure below its target count. */
export const canMaxTreasures = (save: Save) =>
  treasuresBelowTarget(save.slotData.units).length > 0;

/** Raises every treasure except curios to its target count. */
export function maxTreasures(session: SaveSession) {
  const units = session.save.slotData.units;
  const below = treasuresBelowTarget(units);
  if (below.length === 0)
    throw new Error("the treasures are already at their counts");

  const at = units.of(SAVE_ENTITY);
  let acquired = at.get(ITEM_ACQUIRED_LAST);
  const patches: Patch[] = [];
  for (const { entity, target } of below) {
    const item = units.of(entity);
    patches.push(
      { attribute: ITEM_COUNT, entity, values: [target] },
      {
        attribute: ITEM_FLAGS,
        entity,
        values: [
          Number(units.values(ITEM_FLAGS, entity)![0]) |
            ITEM_FLAG_BITS.fieldNote |
            ITEM_FLAG_BITS.seen,
        ],
      },
    );
    if (item.get(ITEM_ACQUIRED) === 0) {
      acquired++;
      patches.push({ attribute: ITEM_ACQUIRED, entity, values: [acquired] });
    }
  }
  patches.push(
    { attribute: ITEM_ACQUIRED_LAST, entity: SAVE_ENTITY, values: [acquired] },
    {
      attribute: INVENTORY_TABS,
      entity: SAVE_ENTITY,
      values: [at.get(INVENTORY_TABS) | INVENTORY_TAB_FIRST],
    },
  );
  session.patch(patches);
}
