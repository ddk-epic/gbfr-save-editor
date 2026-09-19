import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUEST_COUNTER } from "../src/data/quests";
import {
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_LAST_CLEARED,
  SIDE_QUEST_ACCEPTED,
  SIDE_QUEST_IDS,
  SIDE_QUEST_STATE,
} from "../src/domains/quest/attributes";
import { SAVE_ENTITY } from "../src/domains/user/attributes";
import {
  questOrder,
  readCounterQuests,
  readProfile,
  readSave,
  readSideQuests,
} from "../src/index";
import { unitStore } from "./fixture";

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

describe("readSideQuests", () => {
  it("joins the parallel lists by position, skipping empty ids", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [SIDE_QUEST_IDS, [0x00a10001, 0, 0x00a10002, 0x00a10003]],
        [SIDE_QUEST_STATE, [1, 0, 0]],
        [SIDE_QUEST_ACCEPTED, [true, false, true]],
      ],
    });
    // The last id has no state or accepted entry and reads as untouched.
    expect(readSideQuests(units)).toEqual([
      { id: "00A10001", accepted: true, completed: true },
      { id: "00A10002", accepted: true, completed: false },
      { id: "00A10003", accepted: false, completed: false },
    ]);
  });
});

describe("readCounterQuests", () => {
  it("reads difficulty from the id, a grade and date only once cleared", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [COUNTER_QUEST_IDS, [0x10011001, 0, 0x1001b002]],
        [COUNTER_QUEST_CLEARS, [2, 0, 0]],
        [COUNTER_QUEST_FLAGS, [3, 7, 7]],
        [COUNTER_QUEST_LAST_CLEARED, [1_710_000_000, 0, 0]],
      ],
    });
    expect(readCounterQuests(units)).toEqual([
      {
        id: "10011001",
        difficulty: "easy",
        clears: 2,
        grade: "S",
        lastCleared: new Date(1_710_000_000_000),
      },
      {
        id: "1001B002",
        difficulty: "infinity",
        clears: 0,
        grade: undefined,
        lastCleared: undefined,
      },
    ]);
  });

  it("reads an id past the end of the other lists as never cleared", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[COUNTER_QUEST_IDS, [0x10012001]]],
    });
    expect(readCounterQuests(units)).toEqual([
      {
        id: "10012001",
        difficulty: "normal",
        clears: 0,
        grade: undefined,
        lastCleared: undefined,
      },
    ]);
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
