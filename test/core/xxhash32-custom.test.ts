import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";

// Expected values from GBFRDataTools.exe hash-string, and GEEN/ISLAND from SaveIDType.cs.
const CASES: [string, number][] = [
  ["PL0500", 0xdd7a151e],
  ["ITEM_01_0000", 0xdb1d4f35],
  ["GEEN_140_00", 0x1c4d37e4],
  ["ISLAND_1ST", 0x9c9b9723],
  ["cmn_iclb_s_01", 0x7e565629],
  ["abcdefghijklmnop", 0x42eabb05],
  ["abcdefghijklmnopq", 0x61ba8f3f],
  ["abcdefghijklmnopqrstuvwxyz012345", 0xc661bfe8],
  ["abcdefghijklmnopqrstuvwxyz0123456", 0x121ae07b],
];

describe("hashId", () => {
  it.each(CASES)("%s", (id, expected) => {
    expect(hashId(id)).toBe(expected);
  });
});
