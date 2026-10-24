import { EMPTY_HASH } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { hashId } from "../../core/xxhash32-custom";
import type { Patch, SaveSession } from "../../session/save-session";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_KEY,
} from "../item/attributes";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_STRIDE,
  TRAIT_WRIGHTSTONE,
} from "../trait/attributes";
import { SAVE_ENTITY } from "../user/attributes";
import {
  WRIGHTSTONE_FIRST,
  WRIGHTSTONE_ID,
  WRIGHTSTONE_KEY,
  WRIGHTSTONE_LAST_ID,
} from "./attributes";
import { readWrightstone, readWrightstones } from "./read";
import {
  WRIGHTSTONE_MAINS,
  WRIGHTSTONE_PRESETS,
  wrightstoneKey,
  wrightstoneSubs,
  type WrightstoneRoll,
} from "./rolls";

const WRIGHTSTONE_COUNT = 5000;
const ITEM_ENTITIES = 500;

/** Adds an unlocked, unseen stone to the inventory; returns its id. */
export function addWrightstone(session: SaveSession, roll: WrightstoneRoll) {
  checkRoll(roll);
  const units = session.save.slotData.units;
  let entity = WRIGHTSTONE_FIRST;
  while (readWrightstone(units, entity)) entity++;
  if (entity >= WRIGHTSTONE_FIRST + WRIGHTSTONE_COUNT)
    throw new Error("no empty wrightstone entry");
  const id = units.of(SAVE_ENTITY).get(WRIGHTSTONE_LAST_ID) + 1;
  const key = wrightstoneKey(roll);

  session.patch([
    { attribute: WRIGHTSTONE_LAST_ID, entity: SAVE_ENTITY, values: [id] },
    { attribute: WRIGHTSTONE_KEY, entity, values: [hashId(key)] },
    { attribute: WRIGHTSTONE_ID, entity, values: [id] },
    ...traitPatches(entity, roll),
    ...gainItem(units, key),
  ]);
  return id;
}

/** Rerolls an inventory stone by id. */
export function editWrightstone(
  session: SaveSession,
  id: number,
  roll: WrightstoneRoll,
) {
  checkRoll(roll);
  const units = session.save.slotData.units;
  const stone = readWrightstones(units).get(id);
  if (stone === undefined) throw new Error(`no wrightstone with id ${id}`);
  const key = wrightstoneKey(roll);

  session.patch([
    ...traitPatches(stone.entity, roll),
    ...(key === stone.key
      ? []
      : [
          {
            attribute: WRIGHTSTONE_KEY,
            entity: stone.entity,
            values: [hashId(key)],
          },
          ...loseItem(units, stone.key),
          ...gainItem(units, key),
        ]),
  ]);
}

function checkRoll({ family, preset, subs }: WrightstoneRoll) {
  if (!(family in WRIGHTSTONE_MAINS))
    throw new Error(`no wrightstone family ${family}`);
  if (!(preset in WRIGHTSTONE_PRESETS))
    throw new Error(`no wrightstone preset ${preset}`);
  const allowed = wrightstoneSubs(family);
  for (const sub of subs)
    if (!allowed.includes(sub))
      throw new Error(`family ${family} cannot roll sub trait ${sub}`);
}

function traitPatches(entity: UnitEntity, roll: WrightstoneRoll): Patch[] {
  const first =
    TRAIT_FIRST +
    (TRAIT_WRIGHTSTONE + entity - WRIGHTSTONE_FIRST) * TRAIT_STRIDE;
  const keys = [WRIGHTSTONE_MAINS[roll.family], ...roll.subs];
  return keys.flatMap((key, i) => [
    { attribute: TRAIT_KEY, entity: first + i, values: [hashId(key)] },
    {
      attribute: TRAIT_LEVEL,
      entity: first + i,
      values: [WRIGHTSTONE_PRESETS[roll.preset].levels[i]],
    },
  ]);
}

const itemEntity = (units: UnitStore, key: string) => {
  for (let entity = 0; entity < ITEM_ENTITIES; entity++)
    if (units.of(entity).get(ITEM_KEY) === key) return entity;
  return undefined;
};

/** One more of the item, stamped with the next acquisition counter. */
function gainItem(units: UnitStore, key: string): Patch[] {
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
  const acquired = units.of(SAVE_ENTITY).get(ITEM_ACQUIRED_LAST) + 1;
  return [
    ...(added ? [{ attribute: ITEM_KEY, entity, values: [hashId(key)] }] : []),
    {
      attribute: ITEM_COUNT,
      entity,
      values: [units.of(entity).get(ITEM_COUNT) + 1],
    },
    { attribute: ITEM_ACQUIRED, entity, values: [acquired] },
    { attribute: ITEM_ACQUIRED_LAST, entity: SAVE_ENTITY, values: [acquired] },
  ];
}

function loseItem(units: UnitStore, key: string): Patch[] {
  const entity = itemEntity(units, key);
  const count = entity === undefined ? 0 : units.of(entity).get(ITEM_COUNT);
  return entity === undefined || count === 0
    ? []
    : [{ attribute: ITEM_COUNT, entity, values: [count - 1] }];
}
