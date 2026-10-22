// Usage: pnpm mod:check [SaveData1.dat]
// Asks the gbfr.dev.savewatch mod for every live unit and compares them with a
// save file. Run right after the game saves; the two should then match.

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readContainer } from "../src/core/container";
import { decodeSaveDataBinary } from "../src/core/save-data-binary";
import type { LiveUnit } from "./save-diff";

const savePath = process.argv[2];
const dir = join(process.env.RELOADEDIIMODS!, "gbfr.dev.savewatch");
const dumpPath = join(dir, "units.json");

if (!existsSync(dir)) {
  console.error(`${dir} is missing; has the mod run yet?`);
  process.exit(1);
}

const requested = Date.now();
writeFileSync(join(dir, "dump.request"), "");
while (!existsSync(dumpPath) || statSync(dumpPath).mtimeMs < requested) {
  if (Date.now() - requested > 15000) {
    console.error(
      `no dump in ${dir} after 15 s; is the game running with the mod?`,
    );
    process.exit(1);
  }
  await new Promise((done) => setTimeout(done, 250));
}

const save = readContainer(
  readFileSync(
    savePath ??
      join(process.env.LOCALAPPDATA!, "GBFR/Saved/SaveGames/SaveData1.dat"),
  ),
);
const live: LiveUnit[] = JSON.parse(readFileSync(dumpPath, "utf8"));

for (const section of ["slotData"] as const) {
  const key = (u: { attribute: number; entity: number }) =>
    `${u.attribute}:${u.entity}`;
  const file = new Map(
    decodeSaveDataBinary(save[section]).units.map((u) => [key(u), u]),
  );
  const memory = new Map(
    live.filter((u) => u.section === section).map((u) => [key(u), u]),
  );

  const onlyFile = [...file.keys()].filter((k) => !memory.has(k));
  const onlyMemory = [...memory.keys()].filter((k) => !file.has(k));
  const differ: string[] = [];
  const typeDiffer: string[] = [];
  for (const [id, unit] of memory) {
    const other = file.get(id);
    if (!other) continue;
    if (other.valueType !== unit.type)
      typeDiffer.push(`${id} ${other.valueType} vs ${unit.type}`);
    else if (other.values.map(String).join() !== unit.values.map(String).join())
      differ.push(id);
  }

  const attributes = (ids: string[]) =>
    [...new Set(ids.map((id) => id.split(":")[0]))].slice(0, 30).join(" ");
  console.log(
    `${section}: file ${file.size}, memory ${memory.size}, matching ${memory.size - onlyMemory.length - differ.length - typeDiffer.length}`,
  );
  if (onlyFile.length)
    console.log(
      `  only in file: ${onlyFile.length}, attributes ${attributes(onlyFile)}`,
    );
  if (onlyMemory.length)
    console.log(
      `  only in memory: ${onlyMemory.length}, attributes ${attributes(onlyMemory)}`,
    );
  if (typeDiffer.length)
    console.log(`  type differs: ${typeDiffer.slice(0, 10).join(", ")}`);
  if (differ.length)
    console.log(
      `  values differ: ${differ.length}, attributes ${attributes(differ)}`,
    );
}
