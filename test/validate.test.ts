import { describe, expect, it } from "vitest";
import { Attribute } from "../src/core/attribute";
import { FILE_SIZE } from "../src/core/container";
import { ITEM_KEYS } from "../src/data/items";
import { CHARACTER_KEYS } from "../src/data/characters";
import {
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_LAST_CLEARED,
} from "../src/domains/quest/attributes";
import {
  SIGIL_FIRST,
  SIGIL_ID,
  SIGIL_KEY,
} from "../src/domains/sigil/attributes";
import { SAVE_ENTITY } from "../src/domains/user/attributes";
import { fixtureSave, unitStore } from "../src/testing";
import { validateSave } from "../src/validate";

/** Issues a save with nothing in it raises: every table reads as empty. */
const EMPTY_TABLES = [
  "item",
  "chara",
  "story_note_archive",
  "story_note_wordlist",
  "story_note_tips",
  "story_note_bgm",
  "story",
];

const codes = (issues: { code: string }[]) => issues.map((issue) => issue.code);

describe("validateSave", () => {
  it("reports only empty tables for a save holding no units", () => {
    const issues = validateSave(fixtureSave());
    expect(issues.map((issue) => issue.severity)).toEqual(
      issues.map(() => "warning"),
    );
    expect(
      issues
        .flatMap((issue) => (issue.code === "tableCount" ? [issue.table] : []))
        .sort(),
    ).toEqual([...EMPTY_TABLES].sort());
    expect(issues).toContainEqual({
      severity: "warning",
      code: "tableCount",
      table: "item",
      held: 0,
      expected: Object.keys(ITEM_KEYS).length,
    });
    expect(issues).toContainEqual({
      severity: "warning",
      code: "tableCount",
      table: "chara",
      held: 0,
      expected: Object.keys(CHARACTER_KEYS).length,
    });
  });

  it("rejects a header field the format fixes, and SlotData past the file", () => {
    const issues = validateSave(
      fixtureSave({
        header: { systemDataOffset: 0x40, slotDataSize: FILE_SIZE },
      }),
    );
    expect(issues).toContainEqual({
      severity: "reject",
      code: "headerLayout",
      field: "systemDataOffset",
      expected: 0x34,
      actual: 0x40,
    });
    expect(issues).toContainEqual({
      severity: "reject",
      code: "slotDataPastFileSize",
      end: 0x1434 + FILE_SIZE,
      fileSize: FILE_SIZE,
    });
  });

  it("warns on a version it was not written against", () => {
    const issues = validateSave(fixtureSave({ header: { subVersion: 3 } }));
    expect(issues).toContainEqual({
      severity: "warning",
      code: "unexpectedVersion",
      what: "subVersion",
      expected: 2,
      actual: 3,
    });
  });

  it("rejects a checksum of 0", () => {
    const save = fixtureSave();
    save.checksums[4] = 0n;
    expect(validateSave(save)).toContainEqual({
      severity: "reject",
      code: "zeroChecksum",
      index: 4,
    });
  });

  it("checks clear dates against the given now, not the clock", () => {
    const cleared = new Date("2025-06-01T00:00:00Z");
    const units = unitStore({
      [SAVE_ENTITY]: [
        [COUNTER_QUEST_IDS, [0x10011001]],
        [COUNTER_QUEST_CLEARS, [1]],
        [COUNTER_QUEST_LAST_CLEARED, [cleared.getTime() / 1000]],
      ],
    });
    const outOfRange = {
      severity: "reject",
      code: "clearDateOutOfRange",
      id: "10011001",
      date: cleared.toISOString(),
    };
    // A now before the clear date puts it in the future.
    expect(
      validateSave(fixtureSave({ slotData: units }), {
        now: new Date("2025-01-01Z"),
      }),
    ).toContainEqual(outOfRange);
    expect(
      validateSave(fixtureSave({ slotData: units }), {
        now: new Date("2026-01-01Z"),
      }),
    ).not.toContainEqual(outOfRange);
  });

  it("returns a reader's format error as a reject, and keeps checking", () => {
    // 2702 is stored as uint; a sigil id read as int throws on the way.
    const units = unitStore({
      [SIGIL_FIRST]: [
        [Attribute.int(SIGIL_ID.id), 71],
        [SIGIL_KEY, 0],
      ],
    });
    const issues = validateSave(fixtureSave({ slotData: units }));
    expect(issues).toContainEqual({
      severity: "reject",
      code: "wrongValueType",
      attribute: 2702,
      expected: "uint",
      actual: "int",
    });
    // The inventory check stopped, the rest still ran.
    expect(codes(issues)).toContain("tableCount");
  });
});
