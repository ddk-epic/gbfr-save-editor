// Usage: pnpm diff:save [before.dat] [after.dat]

import { readFileSync } from "node:fs";
import { readContainer } from "../src/core/container";
import { decodeSaveDataBinary } from "../src/core/save-data-binary";
import type { SaveHeader, SaveUnit } from "../src/index";

const files = process.argv.slice(2);
if (files.length !== 2) {
  console.error("usage: pnpm diff:save before.dat after.dat");
  process.exit(1);
}

/** Missing keys read as # so the key tables staying quiet does not hide units. */
console.warn = () => {};

const show = (value: unknown) =>
  typeof value === "bigint" ? `${value}n` : String(value);

const list = (values: readonly unknown[]) => `[${values.map(show).join(" ")}]`;

const same = (before: readonly unknown[], after: readonly unknown[]) =>
  before.length === after.length &&
  before.every((v, i) => show(v) === show(after[i]));

/** A short vector in full, a long one as its length. */
const held = (values: readonly unknown[]) =>
  values.length > 8 ? `${values.length} values` : list(values);

/** A short vector pair in full, a long one only where the two differ. */
function changes(before: readonly unknown[], after: readonly unknown[]) {
  if (before.length <= 8 && after.length <= 8)
    return `${list(before)} -> ${list(after)}`;
  const differing = [];
  for (let i = 0; i < Math.max(before.length, after.length); i++)
    if (show(before[i]) !== show(after[i]))
      differing.push(`${i}: ${show(before[i])} -> ${show(after[i])}`);
  const length =
    before.length === after.length
      ? ""
      : `${before.length} -> ${after.length} values, `;
  return length + differing.join(", ");
}

const a = readContainer(readFileSync(files[0]!));
const b = readContainer(readFileSync(files[1]!));

const headerFields = Object.keys(a.header) as (keyof SaveHeader)[];
const headerChanges = headerFields.filter((f) => a.header[f] !== b.header[f]);
console.log(
  headerChanges.length === 0
    ? "header: same"
    : `header: ${headerChanges.map((f) => `${f} ${show(a.header[f])} -> ${show(b.header[f])}`).join(", ")}`,
);

const checksums = a.checksums.filter((sum, i) => sum !== b.checksums[i]).length;
console.log(`checksums: ${checksums} of ${a.checksums.length} differ`);

for (const section of ["systemData", "slotData"] as const) {
  const key = (unit: SaveUnit) => `${unit.attribute}:${unit.entity}`;
  const before = new Map(
    decodeSaveDataBinary(a[section]).units.map((u) => [key(u), u]),
  );
  const after = new Map(
    decodeSaveDataBinary(b[section]).units.map((u) => [key(u), u]),
  );

  const lines: string[] = [];
  for (const [id, unit] of before) {
    const other = after.get(id);
    if (!other) lines.push(`  - ${id} ${unit.valueType} ${held(unit.values)}`);
    else if (!same(unit.values, other.values))
      lines.push(
        `  ~ ${id} ${unit.valueType} ${changes(unit.values, other.values)}`,
      );
  }
  for (const [id, unit] of after)
    if (!before.has(id))
      lines.push(`  + ${id} ${unit.valueType} ${held(unit.values)}`);

  console.log(
    `${section}: ${before.size} -> ${after.size} units, ${a[section].length} -> ${b[section].length} B, ${lines.length} differ`,
  );
  for (const line of lines) console.log(line);
}
