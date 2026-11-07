import { EMPTY_HASH } from "../../core/keys";
import type { Save } from "../../core/read-save";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import type { Patch, SaveSession } from "../../core/session";
import { SAVE_ENTITY } from "../../core/save-entity";
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
const TREASURE_CAP = 999;
const KNICKKNACK_VOUCHER_CAP = 99999;
const KNICKKNACK_VOUCHER = "ITEM_21_0000";
const CURIO_PREFIX = "ITEM_19_";
const CARD_PREFIX = "ITEM_23_";
const PLAIN_CARD = "ITEM_23_0000";
const PLAIN_CARD_COUNT = 99;
const CHARACTER_CARD_COUNT = 1;

/** Hands out ITEM_ACQUIRED stamps after ITEM_ACQUIRED_LAST. */
export function acquisitions(units: UnitStore) {
  const last = units.of(SAVE_ENTITY).get(ITEM_ACQUIRED_LAST);
  let next = last;
  return {
    /** Stamps the item at `entity` as the latest acquired. */
    stamp: (entity: UnitEntity): Patch =>
      units.of(entity).patch(ITEM_ACQUIRED, ++next),
    /** The ITEM_ACQUIRED_LAST patch, none when nothing was stamped. */
    done: (): Patch[] =>
      next === last
        ? []
        : [units.of(SAVE_ENTITY).patch(ITEM_ACQUIRED_LAST, next)],
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
  const stamps = acquisitions(units);
  const patches: Patch[] = [];
  for (const { entity, target } of below) {
    const item = units.of(entity);
    patches.push(
      item.patch(ITEM_COUNT, target),
      item.patch(ITEM_FLAGS, { fieldNote: true, seen: true }),
    );
    if (item.get(ITEM_ACQUIRED) === 0) patches.push(stamps.stamp(entity));
  }
  patches.push(...stamps.done(), at.patch(INVENTORY_TABS, { first: true }));
  session.patch(patches);
}

const itemEntity = (units: UnitStore, key: string) => {
  for (let entity = 0; entity < ITEM_ENTITIES; entity++)
    if (units.of(entity).get(ITEM_KEY) === key) return entity;
  return undefined;
};

/** One more of the item, stamped with the next acquisition counter. */
export function gainItem(units: UnitStore, key: string): Patch[] {
  let entity = itemEntity(units, key);
  const added = entity === undefined;
  if (entity === undefined) {
    entity = 0;
    while (
      entity < ITEM_ENTITIES &&
      units.get(ITEM_KEY, entity)?.values[0] !== EMPTY_HASH
    )
      entity++;
    if (entity === ITEM_ENTITIES) throw new Error("no empty item entry");
  }
  const stamps = acquisitions(units);
  const item = units.of(entity);
  return [
    ...(added ? [item.patch(ITEM_KEY, key)] : []),
    item.patch(ITEM_COUNT, item.get(ITEM_COUNT) + 1),
    stamps.stamp(entity),
    ...stamps.done(),
  ];
}

/** One fewer of the item, none when it is not held. */
export function loseItem(units: UnitStore, key: string): Patch[] {
  const entity = itemEntity(units, key);
  const count = entity === undefined ? 0 : units.of(entity).get(ITEM_COUNT);
  return entity === undefined || count === 0
    ? []
    : [units.of(entity).patch(ITEM_COUNT, count - 1)];
}

/** One more of a held item as a reward, marked as a field note and stamped from `stamps`. */
export function rewardItem(
  units: UnitStore,
  stamps: ReturnType<typeof acquisitions>,
  item: UnitEntity,
  keyItem: boolean,
): Patch[] {
  const held = units.of(item);
  return [
    held.patch(ITEM_COUNT, held.get(ITEM_COUNT) + 1),
    held.patch(ITEM_FLAGS, {
      fieldNote: true,
      ...(keyItem ? { keyItem: true } : {}),
    }),
    stamps.stamp(item),
  ];
}
