import { EMPTY_HASH } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import { hashId } from "../../core/xxhash32-custom";
import type { Patch, SaveSession } from "../../save/session";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_SIGIL,
  TRAIT_STRIDE,
} from "../trait/attributes";
import { SAVE_ENTITY } from "../user/attributes";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_LAST_ID,
  SIGIL_LEVEL,
  SIGIL_LIST_ADDED,
  SIGIL_LIST_FLAGS,
} from "./attributes";
import { readSigil, readSigils } from "./read";
import { sigilGem, type SigilRoll } from "./rolls";

const SIGIL_MAX = 5000;

/** Adds an unlocked, unseen sigil to the first empty entry; returns its id. */
export function addSigil(session: SaveSession, roll: SigilRoll) {
  const key = gemFor(roll);
  const units = session.save.slotData.units;
  if (readSigils(units).size >= SIGIL_MAX)
    throw new Error(`the sigil list holds at most ${SIGIL_MAX}`);
  let entity = SIGIL_FIRST;
  while (readSigil(units, entity)) entity++;
  const id = units.of(SAVE_ENTITY).get(SIGIL_LAST_ID) + 1;
  const flags = units.of(SAVE_ENTITY).get(SIGIL_LIST_FLAGS);

  session.patch([
    { attribute: SIGIL_LAST_ID, entity: SAVE_ENTITY, values: [id] },
    {
      attribute: SIGIL_LIST_FLAGS,
      entity: SAVE_ENTITY,
      values: [flags | SIGIL_LIST_ADDED],
    },
    { attribute: SIGIL_ID, entity, values: [id] },
    ...sigilPatches(entity, key, roll),
  ]);
  return id;
}

/** Rerolls an inventory sigil by id, keeping its gem when the roll fits it. */
export function editSigil(session: SaveSession, id: number, roll: SigilRoll) {
  const sigil = readSigils(session.save.slotData.units).get(id);
  if (sigil === undefined) throw new Error(`no sigil with id ${id}`);
  session.patch(sigilPatches(sigil.entity, gemFor(roll, sigil.key), roll));
}

function gemFor(roll: SigilRoll, current?: string) {
  const key = sigilGem(roll, current);
  if (key === undefined)
    throw new Error(
      `no level ${roll.level} sigil of ${roll.primary} with second trait "${roll.secondary}"`,
    );
  return key;
}

/** Key, level and both traits at the sigil's level. */
function sigilPatches(
  entity: UnitEntity,
  key: string,
  roll: SigilRoll,
): Patch[] {
  const first =
    TRAIT_FIRST + (TRAIT_SIGIL + entity - SIGIL_FIRST) * TRAIT_STRIDE;
  const traits = [roll.primary, roll.secondary];
  return [
    { attribute: SIGIL_KEY, entity, values: [hashId(key)] },
    { attribute: SIGIL_LEVEL, entity, values: [roll.level] },
    ...traits.flatMap((key, i) => [
      {
        attribute: TRAIT_KEY,
        entity: first + i,
        values: [key ? hashId(key) : EMPTY_HASH],
      },
      { attribute: TRAIT_LEVEL, entity: first + i, values: [roll.level] },
    ]),
  ];
}
