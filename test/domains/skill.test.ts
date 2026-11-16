import { describe, expect, it } from "vitest";
import { hashId } from "@gbfr/core";
import { LOADOUT_FIRST } from "@gbfr/equipment";
import { EQUIP_SKILLS, SKILL_POSITIONS, readEquippedSkills } from "@gbfr/skill";
import { unitStore } from "gbfr-save-editor/testing";

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
