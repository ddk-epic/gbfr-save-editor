import { readdirSync } from "node:fs";
import { readContainer } from "../src/core/container";
import { EMPTY_HASH } from "../src/core/keys";
import { decodeSaveDataBinary } from "../src/core/save-data-binary";
import type { SaveHeader, SaveUnit, ValueType } from "../src/index";

/** Missing keys read as # so the key tables staying quiet does not hide units. */
console.warn = () => {};

type Section = "systemData" | "slotData";

const load = async (dir: string) =>
  Promise.all(
    readdirSync(new URL(dir, import.meta.url), { recursive: true })
      .filter((f) => String(f).endsWith(".ts"))
      .map((f) => import(new URL(`${dir}/${f}`, import.meta.url).href)),
  );

/** Attribute id to the domain export names declaring it. */
const labels = new Map<number, string[]>();
for (const mod of await load("../src/domains"))
  for (const [name, value] of Object.entries(mod)) {
    const id = (value as { id?: unknown; valueType?: unknown } | null)?.id;
    if (
      typeof id !== "number" ||
      typeof (value as { valueType?: unknown }).valueType !== "string"
    )
      continue;
    const names = labels.get(id) ?? [];
    if (!names.includes(name)) labels.set(id, [...names, name]);
  }

/** Hash to archive key, across every generated key table. */
const keys = new Map<number, string>([[EMPTY_HASH, '""']]);
for (const mod of await load("../src/data"))
  for (const [name, table] of Object.entries(mod))
    if (name.endsWith("_KEYS"))
      for (const [hash, key] of Object.entries(table as Record<string, string>))
        keys.set(Number(hash), key);

/** Units every save rewrites whatever the action, see research/action-diffs.md. */
const NOISE: Record<Section, Record<number, readonly number[] | "all">> = {
  systemData: { 803: "all", 811: "all", 812: "all" },
  slotData: {
    1003: "all",
    2509: "all",
    4004: "all",
    4103: "all",
    7201: "all",
    7601: [0],
    8902: "all",
    8904: "all",
    8909: "all",
    8990: "all",
  },
};

const show = (value: unknown, type: ValueType) => {
  if (typeof value === "bigint") return `${value}n`;
  if (type === "uint" && typeof value === "number" && keys.has(value))
    return keys.get(value)!;
  return String(value);
};

const list = (values: readonly unknown[], type: ValueType) =>
  `[${values.map((v) => show(v, type)).join(" ")}]`;

/** A short vector in full, a long one as its length. */
const held = (values: readonly unknown[], type: ValueType) =>
  values.length > 8 ? `${values.length} values` : list(values, type);

/** Indexes where the two vectors differ, a length change counting the tail. */
function differing(before: readonly unknown[], after: readonly unknown[]) {
  const at: number[] = [];
  for (let i = 0; i < Math.max(before.length, after.length); i++)
    if (String(before[i]) !== String(after[i])) at.push(i);
  return at;
}

/** A short vector pair in full, a long one only where the two differ. */
function changes(
  before: readonly unknown[],
  after: readonly unknown[],
  at: readonly number[],
  type: ValueType,
) {
  if (before.length <= 8 && after.length <= 8)
    return `${list(before, type)} -> ${list(after, type)}`;
  const length =
    before.length === after.length
      ? ""
      : `${before.length} -> ${after.length} values, `;
  return (
    length +
    at
      .map((i) => `${i}: ${show(before[i], type)} -> ${show(after[i], type)}`)
      .join(", ")
  );
}

const label = (attribute: number) => {
  const names = labels.get(attribute);
  return names ? ` ${names.join("/")}` : "";
};

const isNoise = (
  section: Section,
  attribute: number,
  at: readonly number[],
) => {
  const noise = NOISE[section][attribute];
  return noise === "all" || (!!noise && at.every((i) => noise.includes(i)));
};

/** One unit change from the gbfr.dev.savewatch mod; long and ulong values arrive as strings. */
export interface LiveUnit {
  event: "unit" | "unit-added" | "unit-removed";
  section: Section;
  attribute: number;
  entity: number;
  type: ValueType;
  values: unknown[];
  before?: unknown[];
}

/** A live unit change as a diff line, undefined when it is noise and `all` is off. */
export function unitLine(unit: LiveUnit, { all = false } = {}) {
  const wide = unit.type === "long" || unit.type === "ulong";
  const parse = (values: unknown[]) =>
    wide ? values.map((v) => BigInt(v as string)) : values;
  const after = parse(unit.values);
  const id = `${unit.attribute}:${unit.entity}${label(unit.attribute)}`;
  const where = unit.section === "systemData" ? "system " : "";
  if (unit.event === "unit-added")
    return `  + ${where}${id} ${unit.type} ${held(after, unit.type)}`;
  if (unit.event === "unit-removed")
    return `  - ${where}${id} ${unit.type} ${held(after, unit.type)}`;
  const before = parse(unit.before ?? []);
  const at = differing(before, after);
  if (!all && isNoise(unit.section, unit.attribute, at)) return undefined;
  return `  ~ ${where}${id} ${unit.type} ${changes(before, after, at, unit.type)}`;
}

/** The unit-by-unit diff of two save files, noise units left out unless `all`. */
export function diffSaves(
  beforeFile: Uint8Array,
  afterFile: Uint8Array,
  { all = false } = {},
): string[] {
  const a = readContainer(beforeFile);
  const b = readContainer(afterFile);
  const out: string[] = [];

  const headerFields = Object.keys(a.header) as (keyof SaveHeader)[];
  const headerChanges = headerFields.filter((f) => a.header[f] !== b.header[f]);
  if (all || headerChanges.length > 0)
    out.push(
      headerChanges.length === 0
        ? "header: same"
        : `header: ${headerChanges.map((f) => `${f} ${String(a.header[f])} -> ${String(b.header[f])}`).join(", ")}`,
    );

  if (all) {
    const sums = a.checksums.filter((sum, i) => sum !== b.checksums[i]).length;
    out.push(`checksums: ${sums} of ${a.checksums.length} differ`);
  }

  for (const section of ["systemData", "slotData"] as const) {
    const key = (unit: SaveUnit) => `${unit.attribute}:${unit.entity}`;
    const before = new Map(
      decodeSaveDataBinary(a[section]).units.map((u) => [key(u), u]),
    );
    const after = new Map(
      decodeSaveDataBinary(b[section]).units.map((u) => [key(u), u]),
    );

    const lines: string[] = [];
    let hidden = 0;
    for (const [id, unit] of before) {
      const other = after.get(id);
      const type = unit.valueType;
      if (!other) {
        lines.push(
          `  - ${id}${label(unit.attribute)} ${type} ${held(unit.values, type)}`,
        );
        continue;
      }
      const at = differing(unit.values, other.values);
      if (at.length === 0) continue;
      if (!all && isNoise(section, unit.attribute, at)) {
        hidden++;
        continue;
      }
      lines.push(
        `  ~ ${id}${label(unit.attribute)} ${type} ${changes(unit.values, other.values, at, type)}`,
      );
    }
    for (const [id, unit] of after)
      if (!before.has(id))
        lines.push(
          `  + ${id}${label(unit.attribute)} ${unit.valueType} ${held(unit.values, unit.valueType)}`,
        );

    const noise = hidden > 0 ? `, ${hidden} noise hidden` : "";
    out.push(
      `${section}: ${before.size} -> ${after.size} units, ${a[section].length} -> ${b[section].length} B, ${lines.length} differ${noise}`,
      ...lines,
    );
  }
  return out;
}
