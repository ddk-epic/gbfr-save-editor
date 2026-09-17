import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONFLUX_AURAS, CONFLUX_TREE } from "../src/data/conflux";
import { readConflux, readSave } from "../src/index";

// Local save, gitignored. Any save works: these hold at every point of progress.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readConflux", () => {
  const conflux = hasSave
    ? readConflux(readSave(readFileSync(SAVE_PATH)).slotData.units)
    : (undefined as never);

  it("reads every Resonance tree node", () => {
    expect(conflux.resonance).toHaveLength(CONFLUX_TREE.length);
    expect(conflux.resonancePoints).toBeGreaterThanOrEqual(0);
    // Nothing is taken before the root, the first row.
    const taken = conflux.resonance.map((n) => n.taken);
    expect(taken.indexOf(true)).toBeLessThanOrEqual(0);
  });

  it("finds every aura of the table in the save", () => {
    // Every save holds all auras, a new game included.
    expect(conflux.auras).toHaveLength(CONFLUX_AURAS.length);
    expect(conflux.auras.filter((a) => a.key.startsWith("#"))).toEqual([]);
    expect(new Set(conflux.auras.map((a) => a.key)).size).toBe(
      conflux.auras.length,
    );
  });

  it("only marks obtained auras as seen", () => {
    expect(conflux.auras.filter((a) => a.seen && !a.obtained)).toEqual([]);
  });
});
