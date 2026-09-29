import { describe, expect, it } from "vitest";
import {
  MASTERY_FIRST,
  MASTERY_ENTRIES,
} from "../../src/domains/character/attributes";
import {
  MASTERY_NODE_BITS,
  MASTERY_NODE_KEY,
} from "../../src/domains/mastery/attributes";
import {
  readMasteries,
  type MasteryProgress,
} from "../../src/domains/mastery/read";
import { validateMasteries } from "../../src/domains/mastery/validate";
import { unitStore } from "../../src/testing";

const MASTERY = { first: MASTERY_FIRST, count: MASTERY_ENTRIES };

describe("readMasteries", () => {
  it("counts taken nodes and their MSP off the listed nodes", () => {
    // PL0000's ladder 0x00b7a3dd: four defense nodes at 70 MSP each.
    const units = unitStore({
      [MASTERY_FIRST + 10]: [
        [MASTERY_NODE_KEY, 0x00b7a3dd],
        [MASTERY_NODE_BITS, 0b0101],
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
      expect(section).toEqual({
        taken: 0,
        total: 0,
        msp: 0,
        nodes: [],
        bySeries: new Map(),
      });
  });
});

describe("readMasteries by weapon series", () => {
  const counts = (bySeries: Map<number, { taken: number; total: number }>) =>
    Object.fromEntries(
      [...bySeries].map(([series, { taken, total }]) => [
        series,
        [taken, total],
      ]),
    );

  it("counts six nodes per series in Collection and Transcendence", () => {
    const masteries = readMasteries(unitStore(), MASTERY, "PL0000");
    const empty = Object.fromEntries(
      [0, 1, 2, 3, 4, 5].map((s) => [s, [0, 6]]),
    );
    expect(counts(masteries.collection.bySeries)).toEqual(empty);
    expect(counts(masteries.transcendence.bySeries)).toEqual(empty);
    expect(masteries.offense.bySeries.size).toBe(0);
  });

  it("splits one ladder's bits across the series of its nodes", () => {
    // PL0000's T7 ladder 0x06946300: bits 0-1 series 4, 2-3 series 5, 4-5 series 3.
    const units = unitStore({
      [MASTERY_FIRST + 10]: [
        [MASTERY_NODE_KEY, 0x06946300],
        [MASTERY_NODE_BITS, 0b010101],
      ],
    });
    const { transcendence } = readMasteries(units, MASTERY, "PL0000");
    expect(counts(transcendence.bySeries)).toMatchObject({
      3: [1, 6],
      4: [1, 6],
      5: [1, 6],
    });
    expect(transcendence.bySeries.get(4)!.msp).toBe(100);
  });

  it("has no Stunner or Executioner for a DLC character", () => {
    const { collection } = readMasteries(unitStore(), MASTERY, "PL2900");
    expect([...collection.bySeries.keys()].sort()).toEqual([0, 2, 3, 4]);
  });
});

describe("validateMasteries", () => {
  const progress = (taken: number, total: number): MasteryProgress => ({
    taken,
    total,
    msp: 0,
    nodes: [],
    bySeries: new Map(),
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
