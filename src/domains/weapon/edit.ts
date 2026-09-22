import { EMPTY_HASH } from "../../core/keys";
import type { SaveSession } from "../../session/save-session";
import {
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_WEAPON,
  traitRange,
} from "../trait/attributes";
import { findWeaponById } from "./read";
import { WEAPON_FIRST, WEAPON_WRIGHTSTONE } from "./attributes";

export function removeWrightstone(session: SaveSession, weaponId: number) {
  const units = session.save.slotData.units;
  const entity = findWeaponById(units, weaponId);
  if (entity === undefined) throw new Error(`no weapon with id ${weaponId}`);
  if (units.of(entity).get(WEAPON_WRIGHTSTONE) === undefined)
    throw new Error(`weapon ${weaponId} has no wrightstone`);

  const traits = units.entitiesWith(
    TRAIT_KEY,
    traitRange(TRAIT_WEAPON + entity - WEAPON_FIRST),
  );
  session.patch([
    { attribute: WEAPON_WRIGHTSTONE, entity, values: [EMPTY_HASH] },
    ...traits.flatMap((trait) => [
      { attribute: TRAIT_KEY, entity: trait, values: [EMPTY_HASH] },
      { attribute: TRAIT_LEVEL, entity: trait, values: [0] },
    ]),
  ]);
}
