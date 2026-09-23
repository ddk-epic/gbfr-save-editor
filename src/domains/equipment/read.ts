import type { UnitEntity } from "../../core/save-data-binary";
import type { Attribute } from "../../core/attribute";
import type { UnitStore } from "../../core/unit-store";
import { CHARACTER_KEY } from "../character/attributes";
import { SIGIL_POSITIONS } from "../sigil/attributes";
import {
  findSigilById,
  readSigil,
  readSigils,
  type Sigil,
} from "../sigil/read";
import {
  findWeaponById,
  readWeapon,
  readWeapons,
  type Weapon,
} from "../weapon/read";
import { EQUIP_SIGILS, EQUIP_WEAPON } from "./attributes";

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
export function equipmentLookup(units: UnitStore): EquipmentLookup {
  const sigils = readSigils(units);
  const weapons = readWeapons(units);
  return { sigil: (id) => sigils.get(id), weapon: (id) => weapons.get(id) };
}

/** Find by id. */
const findingLookup = (units: UnitStore): EquipmentLookup => ({
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
  units: UnitStore,
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
    sigils: Array.from({ length: SIGIL_POSITIONS }, (_, i) => {
      const id = sigilIds[i];
      return id ? lookup.sigil(id) : undefined;
    }),
  };
}

/** For one character's live equipment. */
export const readCharacterEquipment = (
  units: UnitStore,
  gear: UnitEntity,
): Equipment | undefined =>
  readEquipment(units, gear, CHARACTER_KEY, findingLookup(units));
