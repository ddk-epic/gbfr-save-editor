import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import type { Patch } from "../../core/session";
import {
  TRAIT_FIRST,
  TRAIT_STRIDE,
  TRAIT_WRIGHTSTONE,
} from "../trait/attributes";
import { setTraits } from "../trait/edit";
import { SAVE_ENTITY } from "../../core/save-entity";
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

/** Patches adding an unlocked, unseen stone to the first empty entry, with its id and item key. */
export function newWrightstone(units: UnitStore, roll: WrightstoneRoll) {
  checkRoll(roll);
  let entity = WRIGHTSTONE_FIRST;
  while (readWrightstone(units, entity)) entity++;
  if (entity >= WRIGHTSTONE_FIRST + WRIGHTSTONE_COUNT)
    throw new Error("no empty wrightstone entry");
  const id = units.of(SAVE_ENTITY).get(WRIGHTSTONE_LAST_ID) + 1;
  const key = wrightstoneKey(roll);

  const patches = [
    units.of(SAVE_ENTITY).patch(WRIGHTSTONE_LAST_ID, id),
    units.of(entity).patch(WRIGHTSTONE_KEY, key),
    units.of(entity).patch(WRIGHTSTONE_ID, id),
    ...traitPatches(units, entity, roll),
  ];
  return { id, key, patches };
}

/** Patches rerolling an inventory stone by id, with its item key before and after. */
export function rerollWrightstone(
  units: UnitStore,
  id: number,
  roll: WrightstoneRoll,
) {
  checkRoll(roll);
  const stone = readWrightstones(units).get(id);
  if (stone === undefined) throw new Error(`no wrightstone with id ${id}`);
  const key = wrightstoneKey(roll);

  const patches = [
    ...traitPatches(units, stone.entity, roll),
    ...(key === stone.key
      ? []
      : [units.of(stone.entity).patch(WRIGHTSTONE_KEY, key)]),
  ];
  return { previous: stone.key, key, patches };
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

function traitPatches(
  units: UnitStore,
  entity: UnitEntity,
  roll: WrightstoneRoll,
): Patch[] {
  const first =
    TRAIT_FIRST +
    (TRAIT_WRIGHTSTONE + entity - WRIGHTSTONE_FIRST) * TRAIT_STRIDE;
  const keys = [WRIGHTSTONE_MAINS[roll.family], ...roll.subs];
  return setTraits(
    units,
    first,
    keys.map((key, i) => ({
      key,
      level: WRIGHTSTONE_PRESETS[roll.preset].levels[i]!,
    })),
  );
}
