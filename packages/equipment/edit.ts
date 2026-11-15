import type { UnitEntity } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { CHARACTER_KEY } from "@gbfr/character";
import { EQUIP_WEAPON } from "./attributes";
import { equippableWeapons } from "./read";

/** Equips one of the character's own weapons, by `WEAPON_ID`. */
export function equipWeapon(
  draft: Draft,
  character: UnitEntity,
  weaponId: number,
) {
  if (draft.of(character).get(CHARACTER_KEY) === undefined)
    throw new Error(`no character at ${character}`);
  if (!equippableWeapons(draft, character).some(({ id }) => id === weaponId))
    throw new Error(`character ${character} cannot equip weapon ${weaponId}`);

  draft.of(character).set(EQUIP_WEAPON, weaponId);
}
