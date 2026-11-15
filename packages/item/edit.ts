import {
  EMPTY_HASH,
  type Save,
  type UnitEntity,
  type Units,
  SAVE_ENTITY,
} from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  INVENTORY_TABS,
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "./attributes";
import { itemTab } from "./read";

const ITEM_ENTITIES = 500;
export const TREASURE_CAP = 999;
const KNICKKNACK_VOUCHER_CAP = 99999;
const KNICKKNACK_VOUCHER = "ITEM_21_0000";
const CURIO_PREFIX = "ITEM_19_";
const CARD_PREFIX = "ITEM_23_";
const PLAIN_CARD = "ITEM_23_0000";
const PLAIN_CARD_COUNT = 99;
const CHARACTER_CARD_COUNT = 1;

/** Hands out ITEM_ACQUIRED stamps after ITEM_ACQUIRED_LAST. */
export function acquisitions(draft: Draft) {
  const last = draft.of(SAVE_ENTITY).get(ITEM_ACQUIRED_LAST);
  let next = last;
  return {
    /** Stamps the item at `entity` as the latest acquired. */
    stamp: (entity: UnitEntity) => draft.of(entity).set(ITEM_ACQUIRED, ++next),
    /** Writes ITEM_ACQUIRED_LAST, unless nothing was stamped. */
    done: () => {
      if (next !== last) draft.of(SAVE_ENTITY).set(ITEM_ACQUIRED_LAST, next);
    },
  };
}

function treasureTarget(key: string): number | undefined {
  if (itemTab(key) !== "treasures" || key.startsWith(CURIO_PREFIX))
    return undefined;
  if (key === KNICKKNACK_VOUCHER) return KNICKKNACK_VOUCHER_CAP;
  if (key === PLAIN_CARD) return PLAIN_CARD_COUNT;
  if (key.startsWith(CARD_PREFIX)) return CHARACTER_CARD_COUNT;
  return TREASURE_CAP;
}

function treasuresBelowTarget(units: Units) {
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
export function maxTreasures(draft: Draft) {
  const below = treasuresBelowTarget(draft);
  if (below.length === 0)
    throw new Error("the treasures are already at their counts");

  const stamps = acquisitions(draft);
  for (const { entity, target } of below) {
    const item = draft.of(entity);
    item.set(ITEM_COUNT, target);
    item.set(ITEM_FLAGS, { fieldNote: true, seen: true });
    if (item.get(ITEM_ACQUIRED) === 0) stamps.stamp(entity);
  }
  stamps.done();
  draft.of(SAVE_ENTITY).set(INVENTORY_TABS, { first: true });
}

const itemEntity = (units: Units, key: string) => {
  for (let entity = 0; entity < ITEM_ENTITIES; entity++)
    if (units.of(entity).get(ITEM_KEY) === key) return entity;
  return undefined;
};

/** One more of the item, stamped with the next acquisition counter. */
export function gainItem(draft: Draft, key: string) {
  let entity = itemEntity(draft, key);
  const added = entity === undefined;
  if (entity === undefined) {
    entity = 0;
    while (
      entity < ITEM_ENTITIES &&
      draft.values(ITEM_KEY, entity)?.[0] !== EMPTY_HASH
    )
      entity++;
    if (entity === ITEM_ENTITIES) throw new Error("no empty item entry");
  }
  const stamps = acquisitions(draft);
  const item = draft.of(entity);
  if (added) item.set(ITEM_KEY, key);
  item.set(ITEM_COUNT, item.get(ITEM_COUNT) + 1);
  stamps.stamp(entity);
  stamps.done();
}

/** One fewer of the item, none when it is not held. */
export function loseItem(draft: Draft, key: string) {
  const entity = itemEntity(draft, key);
  if (entity === undefined) return;
  const count = draft.of(entity).get(ITEM_COUNT);
  if (count > 0) draft.of(entity).set(ITEM_COUNT, count - 1);
}

/** One more of a held item as a reward, marked as a field note and stamped from `stamps`. */
export function rewardItem(
  draft: Draft,
  stamps: ReturnType<typeof acquisitions>,
  item: UnitEntity,
  keyItem: boolean,
) {
  const held = draft.of(item);
  held.set(ITEM_COUNT, held.get(ITEM_COUNT) + 1);
  held.set(ITEM_FLAGS, {
    fieldNote: true,
    ...(keyItem ? { keyItem: true } : {}),
  });
  stamps.stamp(item);
}
