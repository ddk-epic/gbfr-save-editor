import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FILE_SIZE,
  SaveFormatError,
  VALUE_TYPES,
  readSave,
  type Save,
} from "../src/index";

// Local save, gitignored. Any save works: these hold at every point of progress.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readSave", () => {
  const bytes = hasSave ? readFileSync(SAVE_PATH) : new Uint8Array();
  const save: Save = hasSave ? readSave(bytes) : (undefined as never);

  it("reads the header", () => {
    expect(bytes.byteLength).toBe(FILE_SIZE);
    const { steamId: _steamId, slotDataSize, ...header } = save.header;
    // Fixed by the format. Only slotDataSize moves, with what the slot holds.
    expect(header).toEqual({
      mainVersion: 2,
      subVersion: 2,
      systemDataOffset: 0x34,
      slotDataOffset: 0x1434,
      systemDataSize: 0x410,
    });
    expect(slotDataSize).toBeGreaterThan(0);
    expect(header.slotDataOffset + slotDataSize).toBeLessThanOrEqual(FILE_SIZE);
  });

  it("reads ten non-zero SlotData checksums", () => {
    expect(save.checksums).toHaveLength(10);
    expect(save.checksums.filter((sum) => sum === 0n)).toEqual([]);
  });

  it("decodes every table", () => {
    // Nothing is left undecoded and no attribute mixes two value types, which is
    // what a misread length or a wrong field order shows up as.
    for (const section of [save.systemData, save.slotData]) {
      const attributes = section.units.attributes();
      expect(attributes.length).toBeGreaterThan(0);
      for (const id of attributes) {
        expect(VALUE_TYPES, `attribute ${id}`).toContain(
          section.units.valueTypeOf(id),
        );
        expect(
          section.units.withAttribute(id).length,
          `attribute ${id}`,
        ).toBeGreaterThan(0);
      }
    }
    expect(save.systemData.version).toBeUndefined();
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
