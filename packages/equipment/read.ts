import type { UnitEntity, Attribute, Units } from "@gbfr/core";
import { CHARACTER_KEY } from "@gbfr/character";
import { findSigilById, readSigil, readSigils, type Sigil } from "@gbfr/sigil";
import {
  WEAPON_SERIES_ORDER,
  findWeaponById,
  readWeapon,
  readWeapons,
  type Weapon,
} from "@gbfr/weapon";
import { EQUIP_SIGIL_SLOTS, EQUIP_SIGILS, EQUIP_WEAPON } from "./attributes";

export interface Equipment {
  /** The gear entity for live equipment, the loadout entity for a loadout. */
  entity: UnitEntity;
  /** chara.CharId */
  character: string;
  weapon: Weapon | undefined;
  /** One per sigil position. */
  sigils: (Sigil | undefined)[];
}

/** Equip positions hold ids, not entities, so resolving one needs a way back. */
export interface EquipmentLookup {
  sigil: (id: number) => Sigil | undefined;
  weapon: (id: number) => Weapon | undefined;
}

/** Reads the whole inventory once, for resolving many entities. */
export function equipmentLookup(units: Units): EquipmentLookup {
  const sigils = readSigils(units);
  const weapons = readWeapons(units);
  return { sigil: (id) => sigils.get(id), weapon: (id) => weapons.get(id) };
}

/** Find by id. */
const findingLookup = (units: Units): EquipmentLookup => ({
  sigil: (id) => {
    const entity = findSigilById(units, id);
    return entity === undefined ? undefined : readSigil(units, entity);
  },
  weapon: (id) => {
    const entity = findWeaponById(units, id);
    return entity === undefined ? undefined : readWeapon(units, entity);
  },
});

/**
 * `characterKey` is CHARACTER_KEY for live gear, EQUIP_CHARACTER for a
 * loadout. An entity naming no character is unused.
 */
export function readEquipment(
  units: Units,
  entity: UnitEntity,
  characterKey: Attribute<string | undefined>,
  lookup: EquipmentLookup,
): Equipment | undefined {
  const at = units.of(entity);
  const character = at.get(characterKey);
  if (character === undefined) return undefined;

  const weaponId = at.get(EQUIP_WEAPON);
  const sigilIds = at.get(EQUIP_SIGILS);

  return {
    entity,
    character,
    weapon: weaponId ? lookup.weapon(weaponId) : undefined,
    sigils: Array.from({ length: EQUIP_SIGIL_SLOTS }, (_, i) => {
      const id = sigilIds[i];
      return id ? lookup.sigil(id) : undefined;
    }),
  };
}

/** For one character's live equipment. */
export const readCharacterEquipment = (
  units: Units,
  gear: UnitEntity,
): Equipment | undefined =>
  readEquipment(units, gear, CHARACTER_KEY, findingLookup(units));

const rank = ({ series }: Weapon) => {
  const at = series === undefined ? -1 : WEAPON_SERIES_ORDER.indexOf(series);
  return at === -1 ? WEAPON_SERIES_ORDER.length : at;
};

export function equippableWeapons(
  units: Units,
  character: UnitEntity,
): Weapon[] {
  const characterKey = units.of(character).get(CHARACTER_KEY);
  if (characterKey === undefined) return [];
  return [...readWeapons(units).values()]
    .filter((weapon) => weapon.owned && weapon.character === characterKey)
    .sort((a, b) => rank(a) - rank(b));
}
