import { describe, expect, it } from "vitest";
import type { Curio } from "../../src/domains/curio/read";
import { validateCurios } from "../../src/domains/curio/validate";

const curio = (entity: number, serial: number): Curio => ({
  entity,
  key: "ITEM_19_0001",
  tier: 1,
  serial,
  reward: undefined,
});

describe("validateCurios", () => {
  it("passes serials climbing with the entity", () => {
    expect(validateCurios([curio(1, 3), curio(2, 7)])).toEqual([]);
  });

  it("warns on a serial not above the one before", () => {
    expect(validateCurios([curio(1, 7), curio(2, 7), curio(3, 5)])).toEqual([
      { severity: "warning", code: "curioSerialOrder", entity: 2 },
      { severity: "warning", code: "curioSerialOrder", entity: 3 },
    ]);
  });
});
