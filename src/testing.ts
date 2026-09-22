// Builds saves in memory for tests, without a SaveData*.dat.

import type { Attribute } from "./core/attribute";
import { checksumIndex, slotChecksum } from "./core/checksum";
import { CHECKSUM_COUNT, HEADER_SIZE, type SaveHeader } from "./core/container";
import type { Save } from "./core/read-save";
import {
  ELEMENTS,
  VALUE_TYPES,
  type SaveUnit,
  type ValueType,
} from "./core/save-data-binary";
import { UnitStore } from "./core/unit-store";
import { hashId } from "./core/xxhash32-custom";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
} from "./domains/character/attributes";
import { ITEM_COUNT, ITEM_KEY } from "./domains/item/attributes";
import { SIGIL_FIRST, SIGIL_ID, SIGIL_KEY } from "./domains/sigil/attributes";
import { SAVE_ENTITY, SAVE_HASHSEED } from "./domains/user/attributes";

/**
 * The units one entity holds, as attribute and stored values. A value that is
 * not an array stands for a unit holding that one value.
 */
export type EntityUnits = [Attribute<unknown>, unknown][];

export function saveUnits(
  entities: Record<number, EntityUnits> = {},
): SaveUnit[] {
  const units: SaveUnit[] = [];
  for (const [entity, pairs] of Object.entries(entities))
    for (const [attribute, values] of pairs)
      units.push({
        attribute: attribute.id,
        entity: Number(entity),
        valueType: attribute.valueType,
        values: Array.isArray(values) ? values : [values],
      } as SaveUnit);
  return units;
}

export const unitStore = (entities: Record<number, EntityUnits> = {}) =>
  new UnitStore(saveUnits(entities));

/**
 * A save holding one character, one item and one sigil. Enough for anything
 * reading across domains, such as the app's view, to have rows to build.
 */
export const sampleUnits = () =>
  unitStore({
    [CHARACTER_FIRST]: [
      [CHARACTER_KEY, hashId("PL0000")],
      [CHARACTER_LEVEL, 100],
    ],
    1: [
      [ITEM_KEY, hashId("ITEM_10_0000")],
      [ITEM_COUNT, 3],
    ],
    [SIGIL_FIRST]: [
      [SIGIL_ID, 71],
      [SIGIL_KEY, hashId("GEEN_158_13")],
    ],
  });

/** A save with a valid header and checksums around the given SlotData units. */
export function fixtureSave({
  slotData = unitStore(),
  header = {},
  ...rest
}: Partial<Omit<Save, "header" | "slotData">> & {
  slotData?: UnitStore;
  header?: Partial<SaveHeader>;
} = {}): Save {
  return {
    header: {
      mainVersion: 2,
      steamId: 0n,
      subVersion: 2,
      systemDataOffset: 0x34,
      slotDataOffset: 0x1434,
      systemDataSize: 0x410,
      slotDataSize: 0x1000,
      ...header,
    },
    checksums: Array.from({ length: 10 }, () => 1n),
    systemData: { version: undefined, units: unitStore() },
    slotData: { version: 1, units: slotData },
    ...rest,
  };
}

class ByteWriter {
  private bytes = new Uint8Array(256);
  private view = new DataView(this.bytes.buffer);
  length = 0;

  reserve(size: number): number {
    while (this.length + size > this.bytes.length) {
      const grown = new Uint8Array(this.bytes.length * 2);
      grown.set(this.bytes);
      this.bytes = grown;
      this.view = new DataView(grown.buffer);
    }
    this.length += size;
    return this.length - size;
  }

  // Each reserves before touching the view, since reserving can replace it.
  u16(value: number) {
    const at = this.reserve(2);
    this.view.setUint16(at, value, true);
  }
  u32(value: number) {
    const at = this.reserve(4);
    this.view.setUint32(at, value, true);
  }
  u64(value: bigint) {
    const at = this.reserve(8);
    this.view.setBigUint64(at, value, true);
  }
  setU32 = (at: number, value: number) => this.view.setUint32(at, value, true);
  /** A uoffset at `at` pointing forward to `target`. */
  point = (at: number, target: number) => this.setU32(at, target - at);
  element(valueType: ValueType, value: unknown) {
    const { size, write } = ELEMENTS[valueType] as {
      size: number;
      write: (view: DataView, at: number, value: unknown) => void;
    };
    const at = this.reserve(size);
    write(this.view, at, value);
  }
  bytesWritten = () => this.bytes.slice(0, this.length);
}

/** A table with u32 fields; absent fields take no slot. Returns the table's position. */
function writeTable(out: ByteWriter, fields: (number | undefined)[]): number {
  const present = fields.filter((field) => field !== undefined).length;
  const vtable = out.length;
  out.u16(4 + fields.length * 2);
  out.u16(4 + present * 4);
  let slot = 4;
  for (const field of fields) {
    out.u16(field === undefined ? 0 : slot);
    if (field !== undefined) slot += 4;
  }
  const table = out.length;
  out.u32(table - vtable);
  for (const field of fields) if (field !== undefined) out.u32(field);
  return table;
}

/**
 * Units as a SaveDataBinary FlatBuffer. The decoder reads it back as the same
 * units, though the layout is not the one the game writes.
 */
export function encodeSaveDataBinary(
  units: readonly SaveUnit[],
  version?: number,
): Uint8Array {
  const out = new ByteWriter();
  out.u32(0);
  const byType = VALUE_TYPES.map((valueType) =>
    units.filter((unit) => unit.valueType === valueType),
  );
  // Vector fields hold 0 until their vectors are written.
  const root = writeTable(out, [
    version,
    ...byType.map((group) => (group.length ? 0 : undefined)),
  ]);
  out.point(0, root);
  let field = root + (version === undefined ? 4 : 8);
  for (const group of byType) {
    if (!group.length) continue;
    out.point(field, out.length);
    field += 4;
    out.u32(group.length);
    const slots = out.reserve(group.length * 4);
    group.forEach((unit, i) => {
      const table = writeTable(out, [unit.attribute, unit.entity, 0]);
      out.point(slots + i * 4, table);
      out.point(table + 12, out.length);
      out.u32(unit.values.length);
      for (const value of unit.values) out.element(unit.valueType, value);
    });
  }
  return out.bytesWritten();
}

/**
 * A whole save file around the given SlotData units, with the checksum the
 * seed at SAVE_HASHSEED picks computed and the other nine left stale at 1.
 */
export function fixtureFile(entities: Record<number, EntityUnits>): Uint8Array {
  const units = saveUnits(entities);
  const systemData = encodeSaveDataBinary([]);
  const slotData = encodeSaveDataBinary(units, 1);
  const seed = units.find(
    (unit) =>
      unit.attribute === SAVE_HASHSEED.id && unit.entity === SAVE_ENTITY,
  )?.values[0] as number | undefined;
  const checksums = Array.from({ length: CHECKSUM_COUNT }, () => 1n);
  if (seed !== undefined)
    checksums[checksumIndex(seed)] = slotChecksum(
      slotData,
      checksumIndex(seed),
    );

  const out = new ByteWriter();
  const slotDataOffset = HEADER_SIZE + systemData.length;
  const slotDataSize = slotData.length + CHECKSUM_COUNT * 8 + 0x14;
  out.u32(2);
  out.u64(0n);
  out.u32(0);
  out.u32(2);
  out.u64(BigInt(HEADER_SIZE));
  out.u64(BigInt(slotDataOffset));
  out.u64(BigInt(systemData.length));
  out.u64(BigInt(slotDataSize));
  const file = new Uint8Array(slotDataOffset + slotDataSize);
  file.set(out.bytesWritten());
  file.set(systemData, HEADER_SIZE);
  file.set(slotData, slotDataOffset);
  const view = new DataView(file.buffer);
  const footer = slotDataOffset + slotData.length;
  checksums.forEach((sum, i) => view.setBigUint64(footer + i * 8, sum, true));
  view.setBigUint64(footer + 0x50, BigInt(slotData.length), true);
  view.setBigUint64(footer + 0x58, BigInt(CHECKSUM_COUNT * 8), true);
  view.setUint32(footer + 0x60, 1, true);
  return file;
}
