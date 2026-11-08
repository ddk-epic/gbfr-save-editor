import type { Attribute } from "./attribute";
import type { UnitAttribute } from "./save-data-binary";
import { hashId } from "./xxhash32-custom";

/** Hash of "", the save's value for an empty id. */
export const EMPTY_HASH = hashId("");

export interface KeyTable {
  /** The game table name, such as `gem` or `story_note_archive`. */
  name: string;
  keys: Readonly<Record<number, string>>;
}

export const keyTable = (
  name: string,
  keys: Readonly<Record<number, string>>,
): KeyTable => ({ name, keys });

const warned = new Set<string>();

/** Archive key for a hash, "#" + 8 hex digits when the table has none. */
export function keyOf(
  table: KeyTable,
  hash: number | undefined,
): string | undefined {
  if (hash === undefined || hash === EMPTY_HASH) return undefined;
  const key = table.keys[hash];
  if (key !== undefined) return key;

  const unresolved = `#${hash.toString(16).padStart(8, "0")}`;
  // Warns once per table and hash.
  if (!warned.has(`${table.name}${unresolved}`)) {
    warned.add(`${table.name}${unresolved}`);
    console.warn(
      `gbfr-save-editor: hash ${unresolved} not in the ${table.name} table, run pnpm gen:data or check the extract`,
    );
  }
  return unresolved;
}

export function hashAttribute(
  id: UnitAttribute,
): Attribute<number | undefined> {
  return {
    id,
    valueType: "uint",
    read(values) {
      const hash = values?.[0] as number | undefined;
      return hash === undefined || hash === EMPTY_HASH ? undefined : hash;
    },
    write: (value) => [value ?? EMPTY_HASH],
  };
}

const hashesByTable = new WeakMap<KeyTable, Map<string, number>>();

/** Hash of a table key, hashing the key when the table lacks it. */
export function hashOfKey(table: KeyTable, key: string): number {
  let hashes = hashesByTable.get(table);
  if (!hashes) {
    hashes = new Map(
      Object.entries(table.keys).map(([hash, name]) => [name, Number(hash)]),
    );
    hashesByTable.set(table, hashes);
  }
  return hashes.get(key) ?? hashId(key);
}

export function keyAttribute(
  id: UnitAttribute,
  table: KeyTable,
): Attribute<string | undefined> {
  return {
    id,
    valueType: "uint",
    read: (values) => keyOf(table, values?.[0] as number | undefined),
    write(value) {
      if (value === undefined) return [EMPTY_HASH];
      const unresolved = /^#([0-9a-f]{8})$/.exec(value);
      return [
        unresolved ? parseInt(unresolved[1]!, 16) : hashOfKey(table, value),
      ];
    },
  };
}
