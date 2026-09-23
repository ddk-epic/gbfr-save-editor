import type { UnitStore } from "../../core/unit-store";
import { EQUIP_CHARACTER } from "../equipment/attributes";
import {
  readEquipment,
  type Equipment,
  type EquipmentLookup,
} from "../equipment/read";
import { readEquippedSkills } from "../skill/read";
import {
  PARTY_CHARACTER,
  PARTY_FIRST,
  PARTY_POSITIONS,
  PARTY_SET_COUNT,
  PARTY_SET_FIRST,
  PARTY_SET_STRIDE,
} from "./attributes";

export interface PartyMember extends Equipment {
  skills: (string | undefined)[];
}

export const readParty = (units: UnitStore): (string | undefined)[] =>
  Array.from({ length: PARTY_POSITIONS }, (_, i) =>
    units.of(PARTY_FIRST + i).get(PARTY_CHARACTER),
  );

export function readPartySets(
  units: UnitStore,
  lookup: EquipmentLookup,
): ((PartyMember | undefined)[] | undefined)[] {
  return Array.from({ length: PARTY_SET_COUNT }, (_, set) => {
    const first = PARTY_SET_FIRST + set * PARTY_SET_STRIDE;
    const members = Array.from({ length: PARTY_POSITIONS }, (_, i) => {
      const entity = first + i;
      const equipment = readEquipment(units, entity, EQUIP_CHARACTER, lookup);
      return (
        equipment && {
          ...equipment,
          skills: readEquippedSkills(units, entity),
        }
      );
    });
    return members.some(Boolean) ? members : undefined;
  });
}
