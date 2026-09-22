import { describe, expect, it } from "vitest";
import {
  MASTERY_FIRST,
  MASTERY_ENTRIES,
} from "../../src/domains/character/attributes";
import {
  readMasteries,
  type MasteryProgress,
} from "../../src/domains/mastery/read";
import { validateMasteries } from "../../src/domains/mastery/validate";
import { UNLOCK_KEY, UNLOCK_VALUE } from "../../src/domains/unlock/attributes";
import { unitStore } from "../../src/testing";

const MASTERY = { first: MASTERY_FIRST, count: MASTERY_ENTRIES };

describe("readMasteries", () => {
  it("counts taken nodes and their MSP off the listed nodes", () => {
    // PL0000's ladder 0x00b7a3dd: four defense nodes at 70 MSP each.
    const units = unitStore({
      [MASTERY_FIRST + 10]: [
        [UNLOCK_KEY, 0x00b7a3dd],
        [UNLOCK_VALUE, 0b0101],
      ],
    });
    const masteries = readMasteries(units, MASTERY, "PL0000");
    for (const section of Object.values(masteries)) {
      const taken = section.nodes.filter((node) => node.taken);
      expect(section.taken).toBe(taken.length);
      expect(section.msp).toBe(taken.reduce((sum, node) => sum + node.msp, 0));
    }
    const ladder = Object.values(masteries)
      .flatMap((section) => section.nodes)
      .filter((node) => node.entity === MASTERY_FIRST + 10);
    expect(ladder.map((node) => node.taken)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    expect(Object.values(masteries).reduce((sum, s) => sum + s.msp, 0)).toBe(
      140,
    );
  });

  it("reads every section at zero for a character without nodes", () => {
    const masteries = readMasteries(unitStore(), MASTERY, "NP0100");
    for (const section of Object.values(masteries))
      expect(section).toEqual({ taken: 0, total: 0, msp: 0, nodes: [] });
  });
});

describe("validateMasteries", () => {
  const progress = (taken: number, total: number): MasteryProgress => ({
    taken,
    total,
    msp: 0,
    nodes: [],
  });

  it("rejects a section with more nodes taken than it holds", () => {
    const masteries = readMasteries(unitStore(), MASTERY, "PL0000");
    expect(validateMasteries("PL0000", masteries)).toEqual([]);
    expect(
      validateMasteries("PL0000", { ...masteries, defense: progress(5, 4) }),
    ).toEqual([
      {
        severity: "reject",
        code: "masteryOverTotal",
        character: "PL0000",
        section: "defense",
        taken: 5,
        total: 4,
      },
    ]);
  });
});
