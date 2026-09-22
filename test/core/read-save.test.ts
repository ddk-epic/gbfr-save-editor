import { describe, expect, it } from "vitest";
import { SaveFormatError, readSave } from "../../src/index";

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
