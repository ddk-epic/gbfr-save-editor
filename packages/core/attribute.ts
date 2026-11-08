import type { UnitAttribute, ValueType } from "./save-data-binary";

/** One attribute, its stored value type, and how to read and write it. */
export interface Attribute<T, W = T> {
  readonly id: UnitAttribute;
  readonly valueType: ValueType;
  /** Reads the values of one unit, or the fallback when the save holds none. */
  read(values: readonly unknown[] | undefined): T;
  /** The values to store for `value`, given the unit's current values. */
  write(value: W, current: readonly unknown[] | undefined): unknown[];
}

/** One value, falling back when the unit is missing or empty. */
function scalar<T>(
  id: UnitAttribute,
  valueType: ValueType,
  fallback: T,
): Attribute<T> {
  return {
    id,
    valueType,
    read: (values) => (values?.[0] as T) ?? fallback,
    write: (value) => [value],
  };
}

/** Every value of the unit, empty when the save holds none. */
function list<T>(id: UnitAttribute, valueType: ValueType): Attribute<T[]> {
  return {
    id,
    valueType,
    read: (values) => (values as T[]) ?? [],
    write: (value) => [...value],
  };
}

/** Builds attributes, one per value type the save stores. */
export const Attribute = {
  bool: (id: UnitAttribute, fallback = false) => scalar(id, "bool", fallback),
  byte: (id: UnitAttribute, fallback = 0) => scalar(id, "byte", fallback),
  ubyte: (id: UnitAttribute, fallback = 0) => scalar(id, "ubyte", fallback),
  short: (id: UnitAttribute, fallback = 0) => scalar(id, "short", fallback),
  ushort: (id: UnitAttribute, fallback = 0) => scalar(id, "ushort", fallback),
  int: (id: UnitAttribute, fallback = 0) => scalar(id, "int", fallback),
  uint: (id: UnitAttribute, fallback = 0) => scalar(id, "uint", fallback),
  long: (id: UnitAttribute, fallback = 0n) => scalar(id, "long", fallback),
  ulong: (id: UnitAttribute, fallback = 0n) => scalar(id, "ulong", fallback),
  float: (id: UnitAttribute, fallback = 0) => scalar(id, "float", fallback),

  boolList: (id: UnitAttribute) => list<boolean>(id, "bool"),
  byteList: (id: UnitAttribute) => list<number>(id, "byte"),
  ushortList: (id: UnitAttribute) => list<number>(id, "ushort"),
  intList: (id: UnitAttribute) => list<number>(id, "int"),
  uintList: (id: UnitAttribute) => list<number>(id, "uint"),
  longList: (id: UnitAttribute) => list<bigint>(id, "long"),

  /** A value read as optional, undefined when the save holds no unit. */
  optional: <T>(
    id: UnitAttribute,
    valueType: ValueType,
  ): Attribute<T | undefined> => ({
    id,
    valueType,
    read: (values) => values?.[0] as T | undefined,
    write(value) {
      if (value === undefined) throw new Error(`no value to write to ${id}`);
      return [value];
    },
  }),

  /** Named bits of one unit; a missing unit reads every bit as false. */
  flags: <B extends Record<string, number>>(
    id: UnitAttribute,
    bits: B,
    valueType: ValueType = "uint",
  ): Attribute<
    { [K in keyof B]: boolean },
    Partial<{ [K in keyof B]: boolean }>
  > => {
    const names = Object.keys(bits) as (keyof B)[];
    return {
      id,
      valueType,
      read(values) {
        const flags = (values?.[0] as number) ?? 0;
        const set = {} as { [K in keyof B]: boolean };
        for (const name of names) set[name] = (flags & bits[name]!) !== 0;
        return set;
      },
      write(value, current) {
        let flags = (current?.[0] as number | undefined) ?? 0;
        for (const name of names) {
          const set = value[name];
          if (set === undefined) continue;
          flags = set ? flags | bits[name]! : flags & ~bits[name]!;
        }
        return [flags];
      },
    };
  },

  /** The raw bits of a flags unit, for bits with no name yet. */
  rawFlags: (id: UnitAttribute, valueType: ValueType = "uint") =>
    scalar(id, valueType, 0),

  /** Characters up to the first 0, the save's form for a name. */
  text: (id: UnitAttribute, valueType: ValueType): Attribute<string> => ({
    id,
    valueType,
    read(values) {
      const codes = (values as number[]) ?? [];
      const end = codes.indexOf(0);
      return String.fromCharCode(...(end === -1 ? codes : codes.slice(0, end)));
    },
    write(value, current) {
      if (current === undefined) throw new Error(`no unit ${id} to size text`);
      if (value.length > current.length)
        throw new Error(
          `text of ${value.length} does not fit ${current.length}`,
        );
      return Array.from({ length: current.length }, (_, i) =>
        i < value.length ? value.charCodeAt(i) : 0,
      );
    },
  }),
};
