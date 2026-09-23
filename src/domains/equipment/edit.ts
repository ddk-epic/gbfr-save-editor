import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import type { SaveSession } from "../../session/save-session";
import { CHARACTER_KEY } from "../character/attributes";
import { readWeapons, type Weapon } from "../weapon/read";
import { EQUIP_WEAPON } from "./attributes";

/** The `chara.CharId` a weapon belongs to, from its `WEP_<CharId>_*` key. */
const weaponOwner = (key: string) => key.split("_")[1];

export function equippableWeapons(
  units: UnitStore,
  character: UnitEntity,
): Weapon[] {
  const characterKey = units.of(character).get(CHARACTER_KEY);
  if (characterKey === undefined) return [];
  return [...readWeapons(units).values()]
    .filter(
      (weapon) => weapon.owned && weaponOwner(weapon.key) === characterKey,
    )
    .sort((a, b) => a.id - b.id);
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

  session.patch([
    { attribute: EQUIP_WEAPON, entity: character, values: [weaponId] },
  ]);
}
