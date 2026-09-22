import { describe, expect, it } from "vitest";
import {
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_LAST_CLEARED,
  SIDE_QUEST_ACCEPTED,
  SIDE_QUEST_IDS,
  SIDE_QUEST_STATE,
} from "../../src/domains/quest/attributes";
import { QUEST_COUNTER } from "../../src/data/quests";
import {
  questOrder,
  readCounterQuests,
  readSideQuests,
  type CounterQuest,
} from "../../src/domains/quest/read";
import {
  validateCounterQuests,
  validateSideQuests,
} from "../../src/domains/quest/validate";
import { SAVE_ENTITY } from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

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

describe("validateSideQuests", () => {
  it("rejects a quest listed twice or completed without being accepted", () => {
    expect(
      validateSideQuests([
        { id: "00A10001", accepted: true, completed: true },
        { id: "00A10001", accepted: true, completed: false },
        { id: "00A10002", accepted: false, completed: true },
      ]),
    ).toEqual([
      {
        severity: "reject",
        code: "duplicateQuest",
        list: "side",
        id: "00A10001",
      },
      { severity: "reject", code: "completedNotAccepted", id: "00A10002" },
    ]);
  });
});

describe("validateCounterQuests", () => {
  const now = new Date("2026-01-01");
  const quest = (fields: Partial<CounterQuest>): CounterQuest => ({
    id: "10011001",
    difficulty: "easy",
    clears: 1,
    grade: "S",
    lastCleared: new Date("2025-01-01"),
    ...fields,
  });

  it("passes a cleared quest dated between release and now", () => {
    expect(validateCounterQuests([quest({})], now)).toEqual([]);
  });

  it("rejects a date without a clear, and a date outside release to now", () => {
    expect(
      validateCounterQuests(
        [
          quest({ id: "1", clears: 0 }),
          quest({ id: "2", lastCleared: new Date("2023-12-31") }),
          quest({ id: "3", lastCleared: new Date("2026-01-02") }),
        ],
        now,
      ),
    ).toEqual([
      { severity: "reject", code: "clearDateWithoutClear", id: "1" },
      {
        severity: "reject",
        code: "clearDateOutOfRange",
        id: "2",
        date: "2023-12-31T00:00:00.000Z",
      },
      {
        severity: "reject",
        code: "clearDateOutOfRange",
        id: "3",
        date: "2026-01-02T00:00:00.000Z",
      },
    ]);
  });

  it("rejects a quest listed twice", () => {
    expect(validateCounterQuests([quest({}), quest({})], now)).toEqual([
      {
        severity: "reject",
        code: "duplicateQuest",
        list: "counter",
        id: "10011001",
      },
    ]);
  });
});

describe("questOrder", () => {
  it("indexes every quest of the table once, in its order", () => {
    const ids = QUEST_COUNTER.map(([id]) => id);
    ids.forEach((id, i) => expect(questOrder(id)).toBe(i));
    expect(questOrder("FFFFFFFF")).toBe(Infinity);
  });
});
