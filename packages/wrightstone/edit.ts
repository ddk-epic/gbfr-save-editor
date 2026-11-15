import { type UnitEntity, SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { TRAIT_FIRST, TRAIT_STRIDE, TRAIT_WRIGHTSTONE } from "@gbfr/trait";
import { setTraits } from "@gbfr/trait/edit";
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

/** Adds an unlocked, unseen stone to the first empty entry, and returns its id and item key. */
export function newWrightstone(draft: Draft, roll: WrightstoneRoll) {
  checkRoll(roll);
  let entity = WRIGHTSTONE_FIRST;
  while (readWrightstone(draft, entity)) entity++;
  if (entity >= WRIGHTSTONE_FIRST + WRIGHTSTONE_COUNT)
    throw new Error("no empty wrightstone entry");
  const id = draft.of(SAVE_ENTITY).get(WRIGHTSTONE_LAST_ID) + 1;
  const key = wrightstoneKey(roll);

  draft.of(SAVE_ENTITY).set(WRIGHTSTONE_LAST_ID, id);
  draft.of(entity).set(WRIGHTSTONE_KEY, key);
  draft.of(entity).set(WRIGHTSTONE_ID, id);
  setTraitsOf(draft, entity, roll);
  return { id, key };
}

/** Rerolls an inventory stone by id, and returns its item key before and after. */
export function rerollWrightstone(
  draft: Draft,
  id: number,
  roll: WrightstoneRoll,
) {
  checkRoll(roll);
  const stone = readWrightstones(draft).get(id);
  if (stone === undefined) throw new Error(`no wrightstone with id ${id}`);
  const key = wrightstoneKey(roll);

  setTraitsOf(draft, stone.entity, roll);
  if (key !== stone.key) draft.of(stone.entity).set(WRIGHTSTONE_KEY, key);
  return { previous: stone.key, key };
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

function setTraitsOf(draft: Draft, entity: UnitEntity, roll: WrightstoneRoll) {
  const first =
    TRAIT_FIRST +
    (TRAIT_WRIGHTSTONE + entity - WRIGHTSTONE_FIRST) * TRAIT_STRIDE;
  const keys = [WRIGHTSTONE_MAINS[roll.family], ...roll.subs];
  setTraits(
    draft,
    first,
    keys.map((key, i) => ({
      key,
      level: WRIGHTSTONE_PRESETS[roll.preset].levels[i]!,
    })),
  );
}
