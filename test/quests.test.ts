import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUEST_COUNTER } from "../src/data/quests";
import {
  questOrder,
  readCounterQuests,
  readProfile,
  readSave,
  readSideQuests,
} from "../src/index";

// Local save, gitignored. Any save works: these hold at every point of progress.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe("questOrder", () => {
  const ids = QUEST_COUNTER.map(([id]) => id);

  it("indexes every quest once, one run per difficulty", () => {
    expect(ids.length).toBeGreaterThan(0);
    // A duplicate id would drop a quest out of the order.
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id, i) => expect(questOrder(id)).toBe(i));
    expect(questOrder("FFFFFFFF")).toBe(Infinity);
    // Each difficulty holds one unbroken run, whatever its size, so no quest
    // sorts into another difficulty's stretch of the order.
    const runs = ids
      .map((id) => id[4])
      .filter((digit, i, all) => digit !== all[i - 1]);
    expect(new Set(runs).size).toBe(runs.length);
  });
});

describe.skipIf(!hasSave)("readSideQuests and readCounterQuests", () => {
  const units = hasSave
    ? readSave(readFileSync(SAVE_PATH)).slotData.units
    : (undefined as never);

  it("reads side quests once each", () => {
    const quests = readSideQuests(units);
    expect(quests.length).toBeGreaterThan(0);
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
    // A quest is only completable once accepted.
    expect(quests.filter((q) => q.completed && !q.accepted)).toEqual([]);
  });

  it("reads counter quest clears, summing to the profile", () => {
    const quests = readCounterQuests(units);
    expect(quests.length).toBeGreaterThan(0);
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
    // The profile counts the same clears from a different unit, so a misread
    // clear count or a quest read twice breaks the sum.
    expect(quests.reduce((sum, q) => sum + q.clears, 0)).toBe(
      readProfile(units).questsCleared,
    );
    // A last-cleared date needs a clear behind it, and dates decode into the
    // window between the game's release and now.
    const release = Date.parse("2024-02-01");
    for (const quest of quests.filter((q) => q.lastCleared)) {
      expect(quest.clears, quest.id).toBeGreaterThan(0);
      expect(Number(quest.lastCleared), quest.id).toBeGreaterThan(release);
      expect(Number(quest.lastCleared), quest.id).toBeLessThan(Date.now());
    }
  });
});
