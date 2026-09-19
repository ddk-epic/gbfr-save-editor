import { describe, expect, it } from "vitest";
import { hashId } from "../src/core/xxhash32-custom";
import { ABILITY_POSITIONS } from "../src/domains/ability/attributes";
import {
  EQUIP_CHARACTER,
  EQUIP_SIGILS,
  EQUIP_SKILLS,
  EQUIP_WEAPON,
  LOADOUT_FIRST,
} from "../src/domains/equipment/attributes";
import { equipmentLookup, readEquipment } from "../src/domains/equipment/read";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
  SIGIL_POSITIONS,
} from "../src/domains/sigil/attributes";
import { unitStore } from "./fixture";

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
        [EQUIP_SKILLS, [hashId("SKILL_000_00")]],
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
