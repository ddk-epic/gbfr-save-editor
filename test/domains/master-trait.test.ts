import { describe, expect, it } from "vitest";
import {
  masteryRange,
  CHARACTER_FIRST,
} from "../../src/domains/character/attributes";
import { MASTER_TRAIT_KEY } from "../../src/domains/master-trait/attributes";
import {
  readMasterTraits,
  type MasterTrait,
} from "../../src/domains/master-trait/read";
import { validateMasterTraits } from "../../src/domains/master-trait/validate";
import { unitStore } from "../../src/testing";

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
  position: undefined,
  chosen: true,
  values: [],
  valueScales: [],
  ...fields,
});

const cells = (count: number, rank: MasterTrait["rank"]) =>
  Array.from({ length: count }, () => cell(rank));

describe("readMasterTraits", () => {
  it("gives each cell its board position, whatever cells the save holds", () => {
    // PL0000 Essence r1: the perk, then four cells in Unk30 order; the first two missing.
    const mastery = masteryRange(CHARACTER_FIRST);
    const units = unitStore({
      [mastery.first]: [[MASTER_TRAIT_KEY, 0xec41afa1]],
      [mastery.first + 1]: [[MASTER_TRAIT_KEY, 0xacb6619f]],
      [mastery.first + 2]: [[MASTER_TRAIT_KEY, 0xe9264877]],
    });
    expect(
      readMasterTraits(units, mastery).map((c) => [c.key, c.position]),
    ).toEqual([
      ["EC41AFA1", undefined],
      ["E9264877", 3],
      ["ACB6619F", 4],
    ]);
  });
});

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
