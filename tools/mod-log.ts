// Usage: pnpm mod:log [--all] [--since HH:MM[:SS]] [--sessions] [file.jsonl]
// Renders the gbfr.dev.savewatch mod's live.jsonl as unit diffs, by default
// the latest game session. --all shows noise units, --sessions lists sessions.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { unitLine, type LiveUnit } from "./save-diff";

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const all = args.includes("--all");
const since = option("--since");
const path =
  args.find((a, i) => a.endsWith(".jsonl") && args[i - 1] !== "--since") ??
  join(process.env.RELOADEDIIMODS!, "gbfr.dev.savewatch/live.jsonl");

type Entry = { t: number; event: string } & Partial<Omit<LiveUnit, "event">>;
if (!existsSync(path)) {
  console.error(`${path} is missing; has the mod run yet?`);
  process.exit(1);
}

const entries: Entry[] = readFileSync(path, "utf8")
  .split("\n")
  .flatMap((line) => {
    try {
      return line.trim() ? [JSON.parse(line)] : [];
    } catch {
      return [];
    }
  });

const stamp = (t: number) => {
  const date = new Date(t);
  return `${date.toTimeString().slice(0, 8)}.${String(date.getMilliseconds()).padStart(3, "0")}`;
};

const starts = entries.filter((e) => e.event === "start");
if (args.includes("--sessions")) {
  for (const start of starts)
    console.log(`${new Date(start.t).toLocaleString()}`);
  process.exit(0);
}

/** The latest session, or everything from --since today. */
let from = starts.at(-1)?.t ?? 0;
if (since) {
  const [h = 0, m = 0, s = 0] = since.split(":").map(Number);
  from = new Date().setHours(h, m, s, 0);
}

let heading = 0;
for (const entry of entries) {
  if (entry.t < from) continue;
  if (entry.event.startsWith("unit")) {
    const line = unitLine(entry as LiveUnit, { all });
    if (!line) continue;
    if (entry.t !== heading) console.log(`[${stamp(entry.t)}]`);
    heading = entry.t;
    console.log(line);
  } else {
    const { t, event, ...fields } = entry;
    const extra = Object.entries(fields)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    console.log(`[${stamp(t)}] ${event} ${extra}`.trimEnd());
    heading = 0;
  }
}
