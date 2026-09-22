// Reads and validates save files, printing what it finds per file.
// Usage: pnpm check:save [files...], every tmp/SaveData*.dat by default.
// Unresolved keys still surface as console warnings while reading.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SaveFormatError, readSave, validateSave } from "../src/index";

const files = process.argv.slice(2);
if (files.length === 0)
  for (const name of readdirSync("tmp").sort())
    if (/^SaveData.*\.dat$/.test(name)) files.push(join("tmp", name));
if (files.length === 0) {
  console.error("no save files given and none in tmp/");
  process.exit(1);
}

const summarize = ({ code, ...params }: { code: string }) =>
  [code, ...Object.entries(params).map(([k, v]) => `${k}=${v}`)].join(" ");

let rejected = false;
for (const file of files) {
  let issues;
  try {
    issues = validateSave(readSave(readFileSync(file)));
  } catch (error) {
    if (!(error instanceof SaveFormatError)) throw error;
    issues = [{ severity: "reject" as const, ...error.issue }];
  }
  rejected ||= issues.some((issue) => issue.severity === "reject");
  console.log(`${file}: ${issues.length ? `${issues.length} issues` : "ok"}`);
  for (const { severity, ...issue } of issues)
    console.log(`  ${severity.padEnd(7)} ${summarize(issue)}`);
}
process.exit(rejected ? 1 : 0);
