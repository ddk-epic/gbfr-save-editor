import { type UnitEntity, SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import { WEAPON_LEVEL_XP, WEAPON_ROWS } from "./data.gen";
import { clearTraits } from "@gbfr/trait/edit";
import { TRAIT_WEAPON } from "@gbfr/trait";
import {
  findWeaponById,
  unlockableWeapons,
  WEAPON_LAST_XP,
  type Weapon,
} from "./read";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_LAST_UNCAP,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "./attributes";

/** Adds one weapon as a forge does, at no cost. */
export function forgeWeapon(draft: Draft, character: UnitEntity, key: string) {
  if (!unlockableWeapons(draft, character).some((w) => w.key === key))
    throw new Error(`character ${character} cannot unlock ${key}`);
  const [uncap, level] = WEAPON_ROWS[key]!.forged!;
  const entity = draft.entitiesWhere(WEAPON_ID, 0)[0];
  if (entity === undefined) throw new Error("no free weapon entry");
  const id = draft.of(SAVE_ENTITY).get(WEAPON_LAST_ID) + 1;
  const weapon = draft.of(entity);
  draft.of(SAVE_ENTITY).set(WEAPON_LAST_ID, id);
  weapon.set(WEAPON_ID, id);
  weapon.set(WEAPON_KEY, key);
  weapon.set(WEAPON_XP, WEAPON_LEVEL_XP[level - 1]!);
  weapon.set(WEAPON_UNCAP, uncap);
  weapon.replace(WEAPON_FLAGS, { forged: true });
}

/** Raises weapons to the last uncap and level. */
export function raiseWeapons(draft: Draft, weapons: readonly Weapon[]) {
  for (const { entity } of weapons) {
    draft.of(entity).set(WEAPON_UNCAP, WEAPON_LAST_UNCAP);
    draft.of(entity).set(WEAPON_XP, WEAPON_LAST_XP);
  }
}

export function removeWrightstone(draft: Draft, weaponId: number) {
  const entity = findWeaponById(draft, weaponId);
  if (entity === undefined) throw new Error(`no weapon with id ${weaponId}`);
  if (draft.of(entity).get(WEAPON_WRIGHTSTONE) === undefined)
    throw new Error(`weapon ${weaponId} has no wrightstone`);

  draft.of(entity).set(WEAPON_WRIGHTSTONE, undefined);
  clearTraits(draft, TRAIT_WEAPON + entity - WEAPON_FIRST);
}
