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
    /** Position of the first value in its FlatBuffer, absent on units built in memory. */
    valuesAt?: number;
  };
}[ValueType];

export interface SaveDataBinary {
  /** VersionMaybe, absent in SystemData. */
  version: number | undefined;
  /** Units in file order, table by table. */
  units: SaveUnit[];
}

export const ELEMENTS: {
  [T in ValueType]: {
    size: number;
    read: (reader: ByteReader, at: number) => ValueOf[T];
    write: (view: DataView, at: number, value: ValueOf[T]) => void;
  };
} = {
  bool: {
    size: 1,
    read: (r, at) => r.u8(at) !== 0,
    write: (v, at, x) => v.setUint8(at, x ? 1 : 0),
  },
  byte: {
    size: 1,
    read: (r, at) => r.i8(at),
    write: (v, at, x) => v.setInt8(at, x),
  },
  ubyte: {
    size: 1,
    read: (r, at) => r.u8(at),
    write: (v, at, x) => v.setUint8(at, x),
  },
  short: {
    size: 2,
    read: (r, at) => r.i16(at),
    write: (v, at, x) => v.setInt16(at, x, true),
  },
  ushort: {
    size: 2,
    read: (r, at) => r.u16(at),
    write: (v, at, x) => v.setUint16(at, x, true),
  },
  int: {
    size: 4,
    read: (r, at) => r.i32(at),
    write: (v, at, x) => v.setInt32(at, x, true),
  },
  uint: {
    size: 4,
    read: (r, at) => r.u32(at),
    write: (v, at, x) => v.setUint32(at, x, true),
  },
  long: {
    size: 8,
    read: (r, at) => r.i64(at),
    write: (v, at, x) => v.setBigInt64(at, x, true),
  },
  ulong: {
    size: 8,
    read: (r, at) => r.u64(at),
    write: (v, at, x) => v.setBigUint64(at, x, true),
  },
  float: {
    size: 4,
    read: (r, at) => r.f32(at),
    write: (v, at, x) => v.setFloat32(at, x, true),
  },
};

/** Unit table fields. The schema names them IDType, UnitID and ValueData. */
const UNIT_ATTRIBUTE = 0;
const UNIT_ENTITY = 1;
const UNIT_VALUES = 2;
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
  const valuesField = fieldAt(reader, table, UNIT_VALUES);
  const element = ELEMENTS[valueType];

  const values: ValueOf[T][] = [];
  let first: number | undefined;
  if (valuesField !== undefined) {
    const { start, length } = vectorAt(
      reader,
      valuesField,
      element.size,
      `${valueType} ValueData`,
    );
    first = start;
    for (let i = 0; i < length; i++) {
      values.push(element.read(reader, start + i * element.size));
    }
  }

  return {
    valueType,
    attribute: attributeAt === undefined ? 0 : reader.u32(attributeAt),
    entity: entityAt === undefined ? 0 : reader.u32(entityAt),
    values,
    valuesAt: first,
  } as SaveUnit;
}

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
