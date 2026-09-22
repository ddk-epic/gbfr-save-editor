import { describe, expect, it } from "vitest";
import { Attribute } from "../../src/core/attribute";
import { SaveFormatError } from "../../src/core/errors";
import { unitStore } from "../../src/testing";

const COUNT = Attribute.int(10);
const ID = Attribute.uint(20);
const NAMES = Attribute.ushortList(30);

/** Checks the error's issue, not only its class. */
const issue = (code: string) =>
  expect.objectContaining({ issue: expect.objectContaining({ code }) });

describe("UnitStore", () => {
  it("rejects an attribute stored under two value types", () => {
    expect(() =>
      unitStore({ 1: [[COUNT, 1]], 2: [[Attribute.uint(10), 1]] }),
    ).toThrow(issue("mixedValueType"));
  });

  it("rejects an attribute and entity pair stored twice", () => {
    expect(() =>
      unitStore({
        1: [
          [COUNT, 1],
          [COUNT, 2],
        ],
      }),
    ).toThrow(issue("duplicateUnit"));
  });

  it("lists attributes with their value types, ascending", () => {
    const units = unitStore({
      1: [
        [NAMES, []],
        [ID, 7],
        [COUNT, 3],
      ],
    });
    expect(units.attributes()).toEqual([
      { attribute: 10, valueType: "int" },
      { attribute: 20, valueType: "uint" },
      { attribute: 30, valueType: "ushort" },
    ]);
  });

  it("reads values, or the fallback when the save holds no unit", () => {
    const units = unitStore({
      1: [
        [COUNT, 3],
        [NAMES, [65, 66]],
      ],
    });
    expect(units.of(1).get(COUNT)).toBe(3);
    expect(units.of(1).get(NAMES)).toEqual([65, 66]);
    expect(units.of(2).get(COUNT)).toBe(0);
    expect(units.of(2).get(NAMES)).toEqual([]);
    expect(units.of(1).has(ID)).toBe(false);
    expect(units.values(ID, 1)).toBeUndefined();
  });

  it("lists entities holding an attribute, ascending", () => {
    const units = unitStore({
      12: [[ID, 1]],
      10: [[ID, 1]],
      11: [[COUNT, 1]],
      15: [[ID, 1]],
    });
    expect(units.entitiesWith(ID)).toEqual([10, 12, 15]);
    expect(units.entitiesWith(NAMES)).toEqual([]);
  });

  it("keeps entities within a range, its end excluded", () => {
    const units = unitStore({
      9: [[ID, 1]],
      10: [[ID, 1]],
      14: [[ID, 1]],
      15: [[ID, 1]],
    });
    expect(units.entitiesWith(ID, { first: 10, count: 5 })).toEqual([10, 14]);
    expect(units.entitiesWith(ID, { first: 20, count: 5 })).toEqual([]);
  });

  it("finds entities by first value, a range narrowing the result", () => {
    const units = unitStore({
      3: [[ID, 7]],
      1: [[ID, 7]],
      2: [[ID, 8]],
      20: [[ID, 7]],
    });
    expect(units.entitiesWhere(ID, 7)).toEqual([1, 3, 20]);
    expect(units.entitiesWhere(ID, 7, { first: 0, count: 10 })).toEqual([1, 3]);
    expect(units.entitiesWhere(ID, 9)).toEqual([]);
    expect(units.entitiesWhere(COUNT, 7)).toEqual([]);
  });

  it("rejects an attribute read as another value type, in every lookup", () => {
    const units = unitStore({ 1: [[ID, 7]] });
    const misdeclared = Attribute.int(20);
    const wrongType = issue("wrongValueType");
    expect(() => units.get(misdeclared, 1)).toThrow(wrongType);
    expect(() => units.values(misdeclared, 1)).toThrow(wrongType);
    expect(() => units.of(1).get(misdeclared)).toThrow(wrongType);
    expect(() => units.of(1).has(misdeclared)).toThrow(wrongType);
    expect(() => units.entitiesWith(misdeclared)).toThrow(wrongType);
    expect(() => units.entitiesWhere(misdeclared, 7)).toThrow(wrongType);
    expect(() => units.get(misdeclared, 1)).toThrow(SaveFormatError);
  });
});
