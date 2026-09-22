import { afterEach, describe, expect, it, vi } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  ARCHIVE_KEYS,
  FIELD_NOTE_TREASURE,
  FIELD_NOTE_WEAPONS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  TIP_KEYS,
} from "../../src/data/journal";
import { ITEM_FLAGS, ITEM_KEY } from "../../src/domains/item/attributes";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
  FIELD_NOTE_CHARACTER_FLAGS,
  FIELD_NOTE_CHARACTER_KEY,
  FIELD_NOTE_FOE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
  FIELD_NOTE_WRIGHTSTONE_KEY,
  GLOSSARY_FLAGS,
  GLOSSARY_KEY,
  MUSIC_FLAGS,
  MUSIC_KEY,
  STORY_FLAGS,
  STORY_KEY,
  TIP_FLAGS,
  TIP_KEY,
} from "../../src/domains/journal/attributes";
import {
  readArchives,
  readFieldNotes,
  readGlossary,
  readMainStory,
  readMusic,
  readTips,
} from "../../src/domains/journal/read";
import { validateJournalList } from "../../src/domains/journal/validate";
import { unitStore } from "../../src/testing";

describe("readMainStory", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists entries in story order, not save order", () => {
    const units = unitStore({
      1: [
        [STORY_KEY, hashId("ct0060")],
        [STORY_FLAGS, 1],
      ],
      2: [[STORY_KEY, hashId("cm0010")]],
      3: [[STORY_KEY, hashId("tt0001")]],
    });
    expect(readMainStory(units)).toEqual([
      { key: "tt0001", chapter: 0, unlocked: false, seen: false },
      { key: "cm0010", chapter: 1, unlocked: false, seen: false },
      { key: "ct0060", chapter: 2, unlocked: true, seen: false },
    ]);
  });

  it("puts a row the story order lacks last, as chapter 0", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const units = unitStore({
      1: [[STORY_KEY, 0x12345678]],
      2: [[STORY_KEY, hashId("cm0010")]],
    });
    expect(readMainStory(units).map((e) => [e.key, e.chapter])).toEqual([
      ["cm0010", 1],
      ["#12345678", 0],
    ]);
  });
});

describe("the journal sections", () => {
  const sections = [
    ["archives", readArchives, ARCHIVE_KEY, ARCHIVE_FLAGS, ARCHIVE_KEYS],
    ["glossary", readGlossary, GLOSSARY_KEY, GLOSSARY_FLAGS, GLOSSARY_KEYS],
    ["tips", readTips, TIP_KEY, TIP_FLAGS, TIP_KEYS],
    ["music", readMusic, MUSIC_KEY, MUSIC_FLAGS, MUSIC_KEYS],
  ] as const;

  it.each(sections)(
    "reads one resolved %s row per table row",
    (_name, read, key, flags, table) => {
      const hashes = Object.keys(table).map(Number);
      const units = unitStore(
        Object.fromEntries(
          hashes.map((hash, i) => [
            i + 1,
            [
              [key, hash],
              [flags, 1],
            ],
          ]),
        ),
      );
      expect(read(units)).toEqual(
        hashes.map((hash) => ({
          key: table[hash]!,
          unlocked: true,
          seen: false,
        })),
      );
    },
  );
});

describe("readFieldNotes", () => {
  const units = unitStore({
    1: [
      [FIELD_NOTE_CHARACTER_KEY, hashId("PL0300")],
      [FIELD_NOTE_CHARACTER_FLAGS, 1],
    ],
    2: [
      [FIELD_NOTE_WEAPON_KEY, hashId(FIELD_NOTE_WEAPONS[0]!)],
      [FIELD_NOTE_WEAPON_FLAGS, 4],
    ],
    3: [
      [ITEM_KEY, hashId(FIELD_NOTE_TREASURE[0]!)],
      [ITEM_FLAGS, 4 | 8],
    ],
    4: [[FIELD_NOTE_FOE_KEY, hashId("EM0802")]],
    5: [[FIELD_NOTE_WRIGHTSTONE_KEY, hashId("ITEM_28_0000")]],
  });
  const entries = readFieldNotes(units);
  const of = (category: string) =>
    entries.filter((e) => e.category === category);

  it("lists the five categories in menu order", () => {
    expect([...new Set(entries.map((e) => e.category))]).toEqual([
      ...["characters", "foes", "weapons"],
      ...["treasure", "wrightstones"],
    ]);
    expect(of("characters")).toEqual([
      {
        category: "characters",
        key: "PL0300",
        unlocked: true,
        seen: undefined,
      },
    ]);
  });

  it("covers every Weapons and Treasure row, held or not", () => {
    expect(of("weapons").map((e) => e.key)).toEqual([...FIELD_NOTE_WEAPONS]);
    expect(of("treasure").map((e) => e.key)).toEqual([...FIELD_NOTE_TREASURE]);
    expect(of("weapons").filter((e) => e.unlocked)).toHaveLength(1);
    expect(of("treasure").filter((e) => e.unlocked)).toHaveLength(1);
  });

  it("reads a seen bit on Treasure only", () => {
    expect(of("treasure")[0]!.seen).toBe(true);
    expect(of("treasure")[1]!.seen).toBe(false);
    expect(
      entries.filter(
        (e) => (e.seen !== undefined) !== (e.category === "treasure"),
      ),
    ).toEqual([]);
  });
});

describe("validateJournalList", () => {
  const keys = { 1: "a", 2: "b", 3: "c" };
  const entry = (key: string) => ({ key, unlocked: false, seen: false });

  it("passes one row per table row", () => {
    expect(
      validateJournalList("tips", ["a", "b", "c"].map(entry), keys),
    ).toEqual([]);
  });

  it("warns on a row count off the table and on a row listed twice", () => {
    expect(validateJournalList("tips", ["a", "a"].map(entry), keys)).toEqual([
      {
        severity: "warning",
        code: "duplicateJournalRow",
        list: "tips",
        key: "a",
      },
      {
        severity: "warning",
        code: "tableCount",
        table: "tips",
        held: 2,
        expected: 3,
      },
    ]);
  });
});
