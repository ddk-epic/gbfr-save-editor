// Usage: pnpm diff:save [--all] before.dat after.dat

import { readFileSync } from "node:fs";
import { diffSaves } from "./save-diff";

const args = process.argv.slice(2);
const all = args.includes("--all");
const files = args.filter((a) => a !== "--all");
if (files.length !== 2) {
  console.error("usage: pnpm diff:save [--all] before.dat after.dat");
  process.exit(1);
}

for (const line of diffSaves(readFileSync(files[0]!), readFileSync(files[1]!), {
  all,
}))
  console.log(line);
