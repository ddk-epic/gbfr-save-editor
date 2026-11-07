import type { UnitEntity } from "../../core/save-data-binary";
import type { Patch, SaveSession } from "../../core/session";
import {
  TRAIT_FIRST,
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_SIGIL,
  TRAIT_STRIDE,
} from "../trait/attributes";
import type { UnitStore } from "../../core/unit-store";
import { SAVE_ENTITY } from "../../core/save-entity";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_LAST_ID,
  SIGIL_LEVEL,
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
  const save = units.of(SAVE_ENTITY);

  session.patch([
    save.patch(SIGIL_LAST_ID, id),
    save.patch(SIGIL_LIST_FLAGS, { added: true }),
    units.of(entity).patch(SIGIL_ID, id),
    ...sigilPatches(units, entity, key, roll),
  ]);
  return id;
}

/** Rerolls an inventory sigil by id, keeping its gem when the roll fits it. */
export function editSigil(session: SaveSession, id: number, roll: SigilRoll) {
  const sigil = readSigils(session.save.slotData.units).get(id);
  if (sigil === undefined) throw new Error(`no sigil with id ${id}`);
  session.patch(
    sigilPatches(
      session.save.slotData.units,
      sigil.entity,
      gemFor(roll, sigil.key),
      roll,
    ),
  );
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
  units: UnitStore,
  entity: UnitEntity,
  key: string,
  roll: SigilRoll,
): Patch[] {
  const first =
    TRAIT_FIRST + (TRAIT_SIGIL + entity - SIGIL_FIRST) * TRAIT_STRIDE;
  const traits = [roll.primary, roll.secondary];
  return [
    units.of(entity).patch(SIGIL_KEY, key),
    units.of(entity).patch(SIGIL_LEVEL, roll.level),
    ...traits.flatMap((key, i) => [
      units.of(first + i).patch(TRAIT_KEY, key || undefined),
      units.of(first + i).patch(TRAIT_LEVEL, roll.level),
    ]),
  ];
}
