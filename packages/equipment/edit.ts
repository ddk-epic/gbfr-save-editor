import type { UnitEntity, UnitStore } from "@gbfr/core";
import type { SaveSession } from "@gbfr/core/session";
import { CHARACTER_KEY } from "@gbfr/character";
import { WEAPON_SERIES_ORDER, readWeapons, type Weapon } from "@gbfr/weapon";
import { EQUIP_WEAPON } from "./attributes";

const rank = ({ series }: Weapon) => {
  const at = series === undefined ? -1 : WEAPON_SERIES_ORDER.indexOf(series);
  return at === -1 ? WEAPON_SERIES_ORDER.length : at;
};

export function equippableWeapons(
  units: UnitStore,
  character: UnitEntity,
): Weapon[] {
  const characterKey = units.of(character).get(CHARACTER_KEY);
  if (characterKey === undefined) return [];
  return [...readWeapons(units).values()]
    .filter((weapon) => weapon.owned && weapon.character === characterKey)
    .sort((a, b) => rank(a) - rank(b));
}

/** Equips one of the character's own weapons, by `WEAPON_ID`. */
export function equipWeapon(
  session: SaveSession,
  character: UnitEntity,
  weaponId: number,
) {
  const units = session.save.slotData.units;
  if (units.of(character).get(CHARACTER_KEY) === undefined)
    throw new Error(`no character at ${character}`);
  if (!equippableWeapons(units, character).some(({ id }) => id === weaponId))
    throw new Error(`character ${character} cannot equip weapon ${weaponId}`);

  session.patch([units.of(character).patch(EQUIP_WEAPON, weaponId)]);
}
