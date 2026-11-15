import { type UnitEntity, SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { TRAIT_FIRST, TRAIT_SIGIL, TRAIT_STRIDE } from "@gbfr/trait";
import { setTraits } from "@gbfr/trait/edit";
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
export function addSigil(draft: Draft, roll: SigilRoll) {
  const key = gemFor(roll);
  if (readSigils(draft).size >= SIGIL_MAX)
    throw new Error(`the sigil list holds at most ${SIGIL_MAX}`);
  let entity = SIGIL_FIRST;
  while (readSigil(draft, entity)) entity++;
  const save = draft.of(SAVE_ENTITY);
  const id = save.get(SIGIL_LAST_ID) + 1;

  save.set(SIGIL_LAST_ID, id);
  save.set(SIGIL_LIST_FLAGS, { added: true });
  draft.of(entity).set(SIGIL_ID, id);
  setSigil(draft, entity, key, roll);
  return id;
}

/** Rerolls an inventory sigil by id, keeping its gem when the roll fits it. */
export function editSigil(draft: Draft, id: number, roll: SigilRoll) {
  const sigil = readSigils(draft).get(id);
  if (sigil === undefined) throw new Error(`no sigil with id ${id}`);
  setSigil(draft, sigil.entity, gemFor(roll, sigil.key), roll);
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
function setSigil(
  draft: Draft,
  entity: UnitEntity,
  key: string,
  roll: SigilRoll,
) {
  const first =
    TRAIT_FIRST + (TRAIT_SIGIL + entity - SIGIL_FIRST) * TRAIT_STRIDE;
  const traits = [roll.primary, roll.secondary].map((key) => ({
    key: key || undefined,
    level: roll.level,
  }));
  draft.of(entity).set(SIGIL_KEY, key);
  draft.of(entity).set(SIGIL_LEVEL, roll.level);
  setTraits(draft, first, traits);
}
