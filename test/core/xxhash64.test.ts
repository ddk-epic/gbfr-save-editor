import { describe, expect, it } from "vitest";
import { xxhash64 } from "../../src/core/xxhash64";

// Reference values of the xxHash project and python-xxhash, seed 0.
const CASES: [string, bigint][] = [
  ["", 0xef46db3751d8e999n],
  ["abc", 0x44bc2cf5ad770999n],
  ["Nobody inspects the spammish repetition", 0xfbcea83c8a378bf1n],
];

describe("xxhash64", () => {
  it.each(CASES)("%j", (input, expected) => {
    expect(xxhash64(new TextEncoder().encode(input))).toBe(expected);
  });
});
