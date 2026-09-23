import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import { ABILITY_POSITIONS } from "../../src/domains/ability/attributes";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
} from "../../src/domains/character/attributes";
import {
  EQUIP_CHARACTER,
  EQUIP_SIGILS,
  EQUIP_SKILLS,
  EQUIP_WEAPON,
  LOADOUT_FIRST,
} from "../../src/domains/equipment/attributes";
import {
  equipWeapon,
  equippableWeapons,
} from "../../src/domains/equipment/edit";
import {
  equipmentLookup,
  readEquipment,
} from "../../src/domains/equipment/read";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_POSITIONS,
} from "../../src/domains/sigil/attributes";
import {
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
} from "../../src/domains/weapon/attributes";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile, unitStore, type EntityUnits } from "../../src/testing";

/** WEAPON_FLAGS bit marking a weapon the player holds. */
const WEAPON_OWNED = 1;

const LOADOUT = LOADOUT_FIRST + 2;

describe("readEquipment", () => {
  it("gives one sigil and one skill per position, however many are stored", () => {
    const units = unitStore({
      [SIGIL_FIRST]: [
        [SIGIL_ID, 71],
        [SIGIL_KEY, hashId("GEEN_158_13")],
      ],
      [LOADOUT]: [
        [EQUIP_CHARACTER, hashId("PL0300")],
        [EQUIP_WEAPON, 0],
        [EQUIP_SIGILS, [71, 0, 99]],
        [EQUIP_SKILLS, [hashId("AB_PL0300_05")]],
      ],
    });
    const equipment = readEquipment(
      units,
      LOADOUT,
      EQUIP_CHARACTER,
      equipmentLookup(units),
    )!;
    expect(equipment.character).toBe("PL0300");
    expect(equipment.weapon).toBeUndefined();
    expect(equipment.sigils).toHaveLength(SIGIL_POSITIONS);
    // Id 0 is an empty position; an id with no sigil behind it reads as empty too.
    expect(equipment.sigils.map((sigil) => sigil?.id)).toEqual([
      71,
      ...Array(SIGIL_POSITIONS - 1).fill(undefined),
    ]);
    expect(equipment.skills).toHaveLength(ABILITY_POSITIONS);
    expect(equipment.skills[0]).toBe("AB_PL0300_05");
    expect(equipment.skills.slice(1)).toEqual(
      Array(ABILITY_POSITIONS - 1).fill(undefined),
    );
  });

  it("skips an entity naming no character", () => {
    const units = unitStore({ [LOADOUT]: [[EQUIP_SIGILS, [71]]] });
    expect(
      readEquipment(units, LOADOUT, EQUIP_CHARACTER, equipmentLookup(units)),
    ).toBeUndefined();
  });
});

describe("equipWeapon", () => {
  const CHARACTER = CHARACTER_FIRST + 1;
  const weapon = (
    id: number,
    key: string,
    flags = WEAPON_OWNED,
  ): EntityUnits => [
    [WEAPON_ID, id],
    [WEAPON_KEY, hashId(key)],
    [WEAPON_FLAGS, flags],
  ];
  const inventory = {
    [CHARACTER]: [
      [CHARACTER_KEY, hashId("PL0100")],
      [EQUIP_WEAPON, 72],
    ] as EntityUnits,
    [WEAPON_FIRST]: weapon(72, "WEP_PL0100_02"),
    [WEAPON_FIRST + 1]: weapon(71, "WEP_PL0100_04"),
    // A display copy the player does not hold, and another character's weapon.
    [WEAPON_FIRST + 2]: weapon(40, "WEP_PL0100_A0", 0),
    [WEAPON_FIRST + 3]: weapon(9, "WEP_PL0300_01"),
  };

  it("offers the character's own weapons, held ones only", () => {
    const units = unitStore(inventory);
    expect(equippableWeapons(units, CHARACTER).map((w) => w.id)).toEqual([
      71, 72,
    ]);
    expect(equippableWeapons(units, CHARACTER + 1)).toEqual([]);
  });

  it("equips one of them", () => {
    const session = SaveSession.open(fixtureFile(inventory));
    equipWeapon(session, CHARACTER, 71);
    expect(session.save.slotData.units.values(EQUIP_WEAPON, CHARACTER)).toEqual(
      [71],
    );
  });

  it("refuses a weapon the character cannot hold", () => {
    const session = SaveSession.open(fixtureFile(inventory));
    for (const id of [40, 9, 999])
      expect(() => equipWeapon(session, CHARACTER, id)).toThrow("cannot equip");
    expect(() => equipWeapon(session, CHARACTER + 1, 71)).toThrow(
      "no character at",
    );
  });
});
