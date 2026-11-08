import { describe, expect, it } from "vitest";
import { hashId } from "../../packages/core/xxhash32-custom";
import { canMaxTreasures, maxTreasures } from "../../packages/item/edit";
import {
  INVENTORY_TABS,
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../../packages/item/attributes";
import { SAVE_ENTITY } from "../../packages/core/save-entity";
import { SaveSession } from "../../packages/core/session";
import { fixtureFile } from "../../packages/gbfr-save-editor/testing";

const ROWS: readonly [
  key: number,
  count: number,
  flags: number,
  got: number,
][] = [
  [hashId("ITEM_10_0000"), 0, 0, 0],
  [hashId("ITEM_10_0001"), 5, 13, 3],
  [hashId("ITEM_10_0002"), 999, 12, 4],
  [hashId("ITEM_21_0000"), 63429, 12, 5],
  [0x58fc9b99, 0, 0, 0],
  [hashId("ITEM_23_0000"), 0, 12, 6],
  [hashId("ITEM_23_0001"), 0, 4, 0],
  [hashId("ITEM_23_0006"), 3, 12, 7],
  [hashId("ITEM_19_0001"), 308, 12, 8],
  [hashId("ITEM_19_0002"), 0, 0, 0],
  [hashId("ITEM_70_0004"), 0, 0, 0],
];

const open = (rows = ROWS) =>
  SaveSession.open(
    fixtureFile({
      [SAVE_ENTITY]: [
        [ITEM_ACQUIRED_LAST, 8],
        [INVENTORY_TABS, 4],
      ],
      ...Object.fromEntries(
        rows.map(([key, count, flags, got], index) => [
          index + 1,
          [
            [ITEM_KEY, key],
            [ITEM_COUNT, count],
            [ITEM_FLAGS, flags],
            [ITEM_ACQUIRED, got],
          ],
        ]),
      ),
    }),
  );

describe("maxTreasures", () => {
  it("raises each treasure to its count", () => {
    const session = open();
    maxTreasures(session);
    const units = session.save.slotData.units;
    const count = (row: number) => units.of(row + 1).get(ITEM_COUNT);

    expect(ROWS.map((_, row) => count(row))).toEqual([
      999, 999, 999, 99999, 999, 99, 1, 3, 308, 0, 0,
    ]);
  });

  it("marks raised rows and numbers the newly gained", () => {
    const session = open();
    maxTreasures(session);
    const units = session.save.slotData.units;
    const flags = (row: number) => units.values(ITEM_FLAGS, row + 1);
    const got = (row: number) => units.values(ITEM_ACQUIRED, row + 1);

    expect(flags(0)).toEqual([12]);
    expect(flags(1)).toEqual([13]);
    expect(flags(9)).toEqual([0]);
    expect(flags(10)).toEqual([0]);
    expect(got(0)).toEqual([9]);
    expect(got(1)).toEqual([3]);
    expect(got(4)).toEqual([10]);
    expect(got(6)).toEqual([11]);
    const at = units.of(SAVE_ENTITY);
    expect(at.get(ITEM_ACQUIRED_LAST)).toBe(11);
    expect(units.values(INVENTORY_TABS, SAVE_ENTITY)).toEqual([5]);
  });

  it("is offered until nothing is left to raise", () => {
    const session = open();
    expect(canMaxTreasures(session.save)).toBe(true);
    maxTreasures(session);
    expect(canMaxTreasures(session.save)).toBe(false);
    expect(() => maxTreasures(session)).toThrow("already");
  });
});
