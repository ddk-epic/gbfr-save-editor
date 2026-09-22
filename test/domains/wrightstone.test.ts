import { describe, expect, it } from "vitest";
import { validateWrightstone } from "../../src/domains/wrightstone/validate";

const stone = (...levels: number[]) => ({
  key: "ITEM_28_0000",
  traits: levels.map((level, i) => ({ entity: i, key: "SKILL", level })),
});

describe("validateWrightstone", () => {
  it("passes up to three traits in descending level", () => {
    expect(validateWrightstone("wrightstone", 1, stone(20, 10, 10))).toEqual(
      [],
    );
  });

  it("rejects more than three traits", () => {
    expect(validateWrightstone("weapon", 7, stone(20, 10, 5, 1))).toEqual([
      {
        severity: "reject",
        code: "tooManyTraits",
        holder: "weapon",
        id: 7,
        count: 4,
        max: 3,
      },
    ]);
  });

  it("rejects a loose stone's traits out of order, not a welded one's", () => {
    expect(validateWrightstone("wrightstone", 1, stone(10, 20))).toEqual([
      {
        severity: "reject",
        code: "traitsNotDescending",
        holder: "wrightstone",
        id: 1,
      },
    ]);
    expect(validateWrightstone("weapon", 7, stone(10, 20))).toEqual([]);
  });
});
