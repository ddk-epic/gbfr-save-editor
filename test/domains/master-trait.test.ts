import { describe, expect, it } from "vitest";
import type { MasterTrait } from "../../src/domains/master-trait/read";
import { validateMasterTraits } from "../../src/domains/master-trait/validate";

const cell = (
  rank: MasterTrait["rank"],
  fields: Partial<MasterTrait> = {},
): MasterTrait => ({
  entity: 0,
  key: "SB",
  style: "SB_ATK",
  rank,
  order: 0,
  perk: false,
  chosen: true,
  values: [],
  valueScales: [],
  ...fields,
});

const cells = (count: number, rank: MasterTrait["rank"]) =>
  Array.from({ length: count }, () => cell(rank));

describe("validateMasterTraits", () => {
  it("passes full pools, perks and unchosen cells not counting", () => {
    expect(
      validateMasterTraits("PL0000", [
        ...cells(10, "r1"),
        ...cells(10, "r2"),
        ...cells(10, "r3"),
        ...cells(20, "ex"),
        cell("r1", { perk: true }),
        cell("ex", { chosen: false }),
      ]),
    ).toEqual([]);
  });

  it("rejects a rank with more cells chosen than its pool", () => {
    expect(validateMasterTraits("PL0000", cells(11, "r2"))).toEqual([
      {
        severity: "reject",
        code: "masterTraitPool",
        character: "PL0000",
        rank: "r2",
        chosen: 11,
        pool: 10,
      },
    ]);
  });
});
