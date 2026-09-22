import { describe, expect, it } from "vitest";
import { validateOverMasteries } from "../../src/domains/over-mastery/validate";

describe("validateOverMasteries", () => {
  it("passes levels up to 10 and unrolled lines", () => {
    expect(
      validateOverMasteries("PL0000", [
        { entity: 1, key: "MED_EFF_01", level: 1 },
        { entity: 2, key: "MED_EFF_02", level: 10 },
        undefined,
        undefined,
      ]),
    ).toEqual([]);
  });

  it("rejects a level past 10", () => {
    expect(
      validateOverMasteries("PL0000", [
        { entity: 1, key: "MED_EFF_01", level: 11 },
      ]),
    ).toEqual([
      {
        severity: "reject",
        code: "overMasteryOverMax",
        character: "PL0000",
        entity: 1,
        level: 11,
      },
    ]);
  });
});
