import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FILE_SIZE,
  SaveFormatError,
  VALUE_TYPES,
  readSave,
  type Save,
} from "../src/index";

// Local save, gitignored. Expected numbers measured from tmp/SaveData1.dat.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readSave", () => {
  const bytes = hasSave ? readFileSync(SAVE_PATH) : new Uint8Array();
  const save: Save = hasSave ? readSave(bytes) : (undefined as never);

  it("reads the header", () => {
    expect(bytes.byteLength).toBe(FILE_SIZE);
    const { steamId: _steamId, ...header } = save.header;
    expect(header).toEqual({
      mainVersion: 2,
      subVersion: 2,
      systemDataOffset: 0x34,
      slotDataOffset: 0x1434,
      systemDataSize: 0x410,
      slotDataSize: 0x6a7b24,
    });
  });

  it("reads the SlotData checksums", () => {
    expect(save.checksums).toHaveLength(10);
    expect(save.checksums[0]).toBe(0x1e7c416ba6d9e9fbn);
    expect(save.checksums[9]).toBe(0x1223b8adbd0b810fn);
  });

  it("decodes every table", () => {
    const counts = (section: Save["slotData"]) =>
      Object.fromEntries(
        VALUE_TYPES.map((valueType) => [
          valueType,
          section.units
            .idTypes()
            .filter((id) => section.units.valueTypeOf(id) === valueType)
            .reduce((n, id) => n + section.units.ofIdType(id).length, 0),
        ]),
      );

    expect(save.systemData.version).toBeUndefined();
    expect(counts(save.systemData)).toEqual({
      bool: 13,
      byte: 6,
      ubyte: 2,
      short: 0,
      ushort: 2,
      int: 6,
      uint: 3,
      long: 0,
      ulong: 1,
      float: 0,
    });

    expect(save.slotData.version).toBe(1);
    expect(counts(save.slotData)).toEqual({
      bool: 8801,
      byte: 4352,
      ubyte: 646,
      short: 1,
      ushort: 3,
      int: 71151,
      uint: 124876,
      long: 1154,
      ulong: 1160,
      float: 146,
    });
  });

  it("reads a known unit", () => {
    expect(save.slotData.units.values(1003, 0, "uint")).toEqual([55732345]);
  });
});

describe("readSave on bad input", () => {
  it("rejects a file shorter than the header", () => {
    expect(() => readSave(new Uint8Array(0x10))).toThrow(SaveFormatError);
  });

  it("rejects blob offsets past the end of the file", () => {
    const bytes = new Uint8Array(0x100);
    const view = new DataView(bytes.buffer);
    view.setBigUint64(0x14, 0x34n, true);
    view.setBigUint64(0x1c, 0x1000n, true);
    view.setBigUint64(0x24, 0x10n, true);
    view.setBigUint64(0x2c, 0x100n, true);
    expect(() => readSave(bytes)).toThrow(SaveFormatError);
  });
});
