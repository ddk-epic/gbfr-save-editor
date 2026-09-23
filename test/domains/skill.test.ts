import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import { LOADOUT_FIRST } from "../../src/domains/equipment/attributes";
import {
  EQUIP_SKILLS,
  SKILL_POSITIONS,
} from "../../src/domains/skill/attributes";
import { readEquippedSkills } from "../../src/domains/skill/read";
import { unitStore } from "../../src/testing";

const LOADOUT = LOADOUT_FIRST + 2;

describe("readEquippedSkills", () => {
  it("gives one skill per position, however many are stored", () => {
    const units = unitStore({
      [LOADOUT]: [[EQUIP_SKILLS, [hashId("AB_PL0300_05")]]],
    });
    expect(readEquippedSkills(units, LOADOUT)).toEqual([
      "AB_PL0300_05",
      ...Array(SKILL_POSITIONS - 1).fill(undefined),
    ]);
  });
});
