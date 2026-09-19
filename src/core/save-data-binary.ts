import { ByteReader } from "./bytes";
import { SaveFormatError } from "./errors";

/** Root table vectors in schema order, after VersionMaybe. */
export const VALUE_TYPES = [
  "bool",
  "byte",
  "ubyte",
  "short",
  "ushort",
  "int",
  "uint",
  "long",
  "ulong",
  "float",
] as const;

export type ValueType = (typeof VALUE_TYPES)[number];

export interface ValueOf {
  bool: boolean;
  byte: number;
  ubyte: number;
  short: number;
  ushort: number;
  int: number;
  uint: number;
  long: bigint;
  ulong: bigint;
  float: number;
}

/** The characteristic a unit holds, such as a sigil's level. */
export type UnitAttribute = number;

/** The thing a unit is about, such as one sigil. Save wide units use 0. */
export type UnitEntity = number;

export type SaveUnit = {
  [T in ValueType]: {
    valueType: T;
    attribute: UnitAttribute;
    entity: UnitEntity;
    values: ValueOf[T][];
  };
}[ValueType];

export interface SaveDataBinary {
  /** VersionMaybe, absent in SystemData. */
  version: number | undefined;
  /** Units in file order, table by table. */
  units: SaveUnit[];
}

const ELEMENTS: {
  [T in ValueType]: {
    size: number;
    read: (reader: ByteReader, at: number) => ValueOf[T];
  };
} = {
  bool: { size: 1, read: (r, at) => r.u8(at) !== 0 },
  byte: { size: 1, read: (r, at) => r.i8(at) },
  ubyte: { size: 1, read: (r, at) => r.u8(at) },
  short: { size: 2, read: (r, at) => r.i16(at) },
  ushort: { size: 2, read: (r, at) => r.u16(at) },
  int: { size: 4, read: (r, at) => r.i32(at) },
  uint: { size: 4, read: (r, at) => r.u32(at) },
  long: { size: 8, read: (r, at) => r.i64(at) },
  ulong: { size: 8, read: (r, at) => r.u64(at) },
  float: { size: 4, read: (r, at) => r.f32(at) },
};

/** Unit table fields. The schema names them IDType, UnitID and ValueData. */
const UNIT_ATTRIBUTE = 0;
const UNIT_ENTITY = 1;
const UNIT_VALUES = 2;
/** Root table fields. */
const ROOT_VERSION = 0;
const ROOT_FIRST_TABLE = 1;

/** Absolute position of a table field, or undefined when the field is absent. */
function fieldAt(
  reader: ByteReader,
  table: number,
  index: number,
): number | undefined {
  const vtable = table - reader.i32(table);
  const vtableSize = reader.u16(vtable);
  const slot = 4 + index * 2;
  if (slot + 2 > vtableSize) return undefined;
  const offset = reader.u16(vtable + slot);
  return offset === 0 ? undefined : table + offset;
}

/** Follows a uoffset stored at `at`. */
function deref(reader: ByteReader, at: number): number {
  return at + reader.u32(at);
}

/** Start of a vector's elements and its length. */
function vectorAt(
  reader: ByteReader,
  field: number,
  elementSize: number,
  what: string,
): { start: number; length: number } {
  const vector = deref(reader, field);
  const length = reader.u32(vector);
  const start = vector + 4;
  reader.check(start, length * elementSize, what);
  return { start, length };
}

function readUnit<T extends ValueType>(
  reader: ByteReader,
  table: number,
  valueType: T,
): SaveUnit {
  const attributeAt = fieldAt(reader, table, UNIT_ATTRIBUTE);
  const entityAt = fieldAt(reader, table, UNIT_ENTITY);
  const valuesAt = fieldAt(reader, table, UNIT_VALUES);
  const element = ELEMENTS[valueType];

  const values: ValueOf[T][] = [];
  if (valuesAt !== undefined) {
    const { start, length } = vectorAt(
      reader,
      valuesAt,
      element.size,
      `${valueType} ValueData`,
    );
    for (let i = 0; i < length; i++) {
      values.push(element.read(reader, start + i * element.size));
    }
  }

  return {
    valueType,
    attribute: attributeAt === undefined ? 0 : reader.u32(attributeAt),
    entity: entityAt === undefined ? 0 : reader.u32(entityAt),
    values,
  } as SaveUnit;
}

/** Decodes a SaveDataBinary FlatBuffer. */
export function decodeSaveDataBinary(bytes: Uint8Array): SaveDataBinary {
  const reader = new ByteReader(bytes);
  if (reader.length < 4) {
    throw new SaveFormatError({ code: "flatBufferTooShort" });
  }
  const root = deref(reader, 0);

  const versionAt = fieldAt(reader, root, ROOT_VERSION);
  const units: SaveUnit[] = [];

  VALUE_TYPES.forEach((valueType, i) => {
    const tableAt = fieldAt(reader, root, ROOT_FIRST_TABLE + i);
    if (tableAt === undefined) return;
    const { start, length } = vectorAt(
      reader,
      tableAt,
      4,
      `${valueType} table`,
    );
    for (let k = 0; k < length; k++) {
      units.push(readUnit(reader, deref(reader, start + k * 4), valueType));
    }
  });

  return {
    version: versionAt === undefined ? undefined : reader.u32(versionAt),
    units,
  };
}
