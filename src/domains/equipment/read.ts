import { keyOf } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { Attribute } from "../../core/attribute";
import type { UnitStore } from "../../core/unit-store";
import { ABILITIES, ABILITY_POSITIONS } from "../ability/attributes";
import { SIGIL_POSITIONS } from "../sigil/attributes";
import { readSigils, type Sigil } from "../sigil/read";
import { readWeapons, type Weapon } from "../weapon/read";
import { EQUIP_SIGILS, EQUIP_SKILLS, EQUIP_WEAPON } from "./attributes";

export interface Equipment {
  /** chara.CharId */
  character: string;
  weapon: Weapon | undefined;
  /** One per sigil position, undefined where empty. */
  sigils: (Sigil | undefined)[];
  /** ability.Key per skill position, undefined where empty. */
  skills: (string | undefined)[];
}

/** Equip positions hold ids, not entities, so resolving one needs a way back. */
export interface EquipmentLookup {
  sigils: Map<number, Sigil>;
  weapons: Map<number, Weapon>;
}

export const equipmentLookup = (units: UnitStore): EquipmentLookup => ({
  sigils: readSigils(units),
  weapons: readWeapons(units),
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
  const skills = at.get(EQUIP_SKILLS);

  return {
    character,
    weapon: weaponId ? lookup.weapons.get(weaponId) : undefined,
    sigils: Array.from({ length: SIGIL_POSITIONS }, (_, i) => {
      const id = sigilIds[i];
      return id ? lookup.sigils.get(id) : undefined;
    }),
    skills: Array.from({ length: ABILITY_POSITIONS }, (_, i) =>
      keyOf(ABILITIES, skills[i]),
    ),
  };
}
