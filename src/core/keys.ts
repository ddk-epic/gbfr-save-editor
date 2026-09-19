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
  // Once per hash, so a missing key surfaces without flooding the console.
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
  };
}

export function keyAttribute(
  id: UnitAttribute,
  table: KeyTable,
): Attribute<string | undefined> {
  return {
    id,
    valueType: "uint",
    read: (values) => keyOf(table, values?.[0] as number | undefined),
  };
}
