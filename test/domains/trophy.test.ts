import { describe, expect, it } from "vitest";
import { TROPHIES } from "../../src/data/trophies";
import {
  TROPHY_EARNED,
  TROPHY_SEEN,
} from "../../src/domains/trophy/attributes";
import { readTrophies, type Trophy } from "../../src/domains/trophy/read";
import { validateTrophies } from "../../src/domains/trophy/validate";
import { SAVE_ENTITY } from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

describe("readTrophies", () => {
  const [first, second] = TROPHIES.map(([key]) => key);
  const unknown = Math.max(...TROPHIES.map(([key]) => key)) + 1;
  const bits = (...keys: number[]) =>
    Array.from({ length: unknown + 1 }, (_, key) => keys.includes(key));

  it("lists every badge in table order, earned or not", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [TROPHY_EARNED, bits(second!)],
        [TROPHY_SEEN, bits(second!)],
      ],
    });
    const trophies = readTrophies(units);
    expect(trophies.map((t) => t.key)).toEqual(TROPHIES.map(([key]) => key));
    expect(trophies.filter((t) => t.earned).map((t) => t.key)).toEqual([
      second,
    ]);
    expect(trophies.find((t) => t.key === first)!.earned).toBe(false);
  });

  it("puts an earned badge the table lacks last, under other", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[TROPHY_EARNED, bits(unknown)]],
    });
    expect(readTrophies(units).at(-1)).toEqual({
      key: unknown,
      tab: "other",
      dlc: undefined,
      quantity: undefined,
      earned: true,
      seen: false,
    });
  });
});

describe("validateTrophies", () => {
  const trophy = (fields: Partial<Trophy>): Trophy => ({
    key: 10,
    tab: "story",
    dlc: false,
    quantity: 1,
    earned: true,
    seen: true,
    ...fields,
  });

  it("passes a seen trophy that is earned", () => {
    expect(validateTrophies([trophy({})])).toEqual([]);
  });

  it("warns on a trophy seen but not earned", () => {
    expect(validateTrophies([trophy({ earned: false })])).toEqual([
      { severity: "warning", code: "trophySeenNotEarned", key: 10 },
    ]);
  });

  it("warns on an earned trophy the badge table lacks", () => {
    expect(validateTrophies([trophy({ dlc: undefined })])).toEqual([
      { severity: "warning", code: "trophyNotInTable", key: 10 },
    ]);
  });
});
