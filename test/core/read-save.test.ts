import { describe, expect, it } from "vitest";
import { Attribute } from "../../src/core/attribute";
import { SaveFormatError, readSave } from "../../src/index";
import { fixtureFile } from "../../src/testing";

describe("readSave", () => {
  it("reads back the units a fixture file holds, each value type included", () => {
    const save = readSave(
      fixtureFile({
        0: [
          [Attribute.bool(1), true],
          [Attribute.short(2), -3],
          [Attribute.uint(3), [7, 0xffffffff]],
          [Attribute.long(4), -5n],
          [Attribute.float(5), 0.5],
        ],
        40000: [[Attribute.uint(3), 9]],
      }),
    );
    const at = save.slotData.units.of(0);
    expect(at.get(Attribute.bool(1))).toBe(true);
    expect(at.get(Attribute.short(2))).toBe(-3);
    expect(at.get(Attribute.uintList(3))).toEqual([7, 0xffffffff]);
    expect(at.get(Attribute.long(4))).toBe(-5n);
    expect(at.get(Attribute.float(5))).toBe(0.5);
    expect(save.slotData.units.of(40000).get(Attribute.uint(3))).toBe(9);
    expect(save.slotData.version).toBe(1);
  });
});

describe("readSave on bad input", () => {
  it("rejects a file shorter than the header", () => {
    expect(() => readSave(new Uint8Array(0x10))).toThrow(SaveFormatError);
    expect(() => readSave(new Uint8Array(0x10))).toThrow(
      expect.objectContaining({
        issue: {
          code: "outOfBounds",
          what: "header",
          at: 0,
          size: 0x34,
          length: 0x10,
        },
      }),
    );
  });

  it("rejects blob offsets past the end of the file", () => {
    const bytes = new Uint8Array(0x100);
    const view = new DataView(bytes.buffer);
    view.setBigUint64(0x14, 0x34n, true);
    view.setBigUint64(0x1c, 0x1000n, true);
    view.setBigUint64(0x24, 0x10n, true);
    view.setBigUint64(0x2c, 0x100n, true);
    expect(() => readSave(bytes)).toThrow(
      expect.objectContaining({
        issue: expect.objectContaining({
          code: "outOfBounds",
          what: "SlotData",
        }),
      }),
    );
  });
});
