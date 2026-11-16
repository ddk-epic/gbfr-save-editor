import { describe, expect, it } from "vitest";
import {
  MASTERY_SECTIONS,
  masterySigilSlots,
  type MasteryNode,
  type MasteryProgress,
  type MasterySection,
} from "@gbfr/mastery";
import { sigilSlots } from "@gbfr/character";

const masteries = (
  nodes: Partial<MasteryNode>[] = [],
): Record<MasterySection, MasteryProgress> =>
  Object.fromEntries(
    MASTERY_SECTIONS.map((section, i): [MasterySection, MasteryProgress] => [
      section,
      {
        taken: 0,
        total: 0,
        msp: 0,
        nodes: i === 0 ? (nodes as MasteryNode[]) : [],
        bySeries: new Map(),
      },
    ]),
  ) as Record<MasterySection, MasteryProgress>;

const slotNode = (taken: boolean) => ({
  taken,
  params: [{ key: "7B727910", value: 1 }],
});

describe("sigilSlots", () => {
  it("opens GEMSLOT_01's slots at level 1 and at 5 and 9 fate episodes", () => {
    expect(sigilSlots("PL0000", 0, 0, 0)).toBe(0);
    expect(sigilSlots("PL0000", 1, 4, 0)).toBe(1);
    expect(sigilSlots("PL0000", 1, 5, 0)).toBe(2);
    expect(sigilSlots("PL0000", 1, 9, 0)).toBe(3);
  });

  it("adds one per Sigil Slot mastery node taken", () => {
    const nodes = [slotNode(true), slotNode(true), slotNode(false)];
    expect(
      sigilSlots("PL0000", 1, 9, masterySigilSlots(masteries(nodes))),
    ).toBe(5);
  });

  it("opens only PL2900's level slot, whatever its fate episodes", () => {
    expect(sigilSlots("PL2900", 1, 10, 0)).toBe(1);
  });
});
