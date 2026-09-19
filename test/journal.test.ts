import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hashId } from "../src/core/xxhash32-custom";
import {
  ARCHIVE_KEYS,
  FIELD_NOTE_TREASURE,
  FIELD_NOTE_WEAPONS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "../src/data/journal";
import { TROPHIES } from "../src/data/trophies";
import { ITEM_FLAGS, ITEM_KEY } from "../src/domains/item/attributes";
import {
  FIELD_NOTE_CHARACTER_FLAGS,
  FIELD_NOTE_CHARACTER_KEY,
  FIELD_NOTE_FOE_KEY,
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
  FIELD_NOTE_WRIGHTSTONE_KEY,
  STORY_FLAGS,
  STORY_KEY,
} from "../src/domains/journal/attributes";
import { TROPHY_EARNED, TROPHY_SEEN } from "../src/domains/trophy/attributes";
import { SAVE_ENTITY } from "../src/domains/user/attributes";
import {
  readArchives,
  readFieldNotes,
  readGlossary,
  readMainStory,
  readMusic,
  readSave,
  readTips,
  readTrophies,
  TROPHY_TABS,
  type JournalEntry,
} from "../src/index";
import { unitStore } from "./fixture";

// Local save, gitignored. Any save works: these hold at every point of progress.
// The counts one save happens to show are in research/save-units.md.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("the journal", () => {
  const units = hasSave
    ? readSave(readFileSync(SAVE_PATH)).slotData.units
    : (undefined as never);

  const lists: [string, () => JournalEntry[], Readonly<object>][] = [
    ["archives", () => readArchives(units), ARCHIVE_KEYS],
    ["glossary", () => readGlossary(units), GLOSSARY_KEYS],
    ["tips", () => readTips(units), TIP_KEYS],
    ["music", () => readMusic(units), MUSIC_KEYS],
    ["the main story", () => readMainStory(units), STORY_KEYS],
  ];
  // Every list keeps one row per table row, whatever its flags say.
  for (const [name, read, keys] of lists)
    it(`reads ${name}, one resolved row per table row`, () => {
      const entries = read();
      expect(entries.length).toBe(Object.keys(keys).length);
      expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length);
      expect(entries.filter((e) => e.key.startsWith("#"))).toEqual([]);
    });

  it("orders the main story by chapter", () => {
    const chapters = readMainStory(units).map((e) => e.chapter);
    expect(chapters).toEqual([...chapters].sort((a, b) => a - b));
    // 0 is The Story So Far, 1-14 the Prologue through the Epilogue.
    expect(Math.min(...chapters)).toBe(0);
    expect(Math.max(...chapters)).toBe(14);
  });

  it("resolves every field note", () => {
    const entries = readFieldNotes(units);
    expect(entries.filter((e) => e.key.startsWith("#"))).toEqual([]);
  });

  it("earns no trophy the badge table lacks", () => {
    expect(readTrophies(units).filter((t) => t.dlc === undefined)).toEqual([]);
  });

  it("marks only earned trophies seen", () => {
    expect(readTrophies(units).filter((t) => t.seen && !t.earned)).toEqual([]);
  });
});

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

describe("readTrophies", () => {
  const [first, second] = TROPHIES.map(([key]) => key);
  const unknown = Math.max(...TROPHIES.map(([key]) => key)) + 1;
  const bits = (...keys: number[]) =>
    Array.from({ length: unknown + 1 }, (_, key) => keys.includes(key));

  it("lists every badge in table order, earned or not", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [TROPHY_EARNED, bits(second!)],
        [TROPHY_SEEN, bits(second!)],
      ],
    });
    const trophies = readTrophies(units);
    expect(trophies.map((t) => t.key)).toEqual(TROPHIES.map(([key]) => key));
    expect(trophies.filter((t) => t.earned).map((t) => t.key)).toEqual([
      second,
    ]);
    expect(trophies.find((t) => t.key === first)!.earned).toBe(false);
  });

  it("puts an earned badge the table lacks last, under other", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[TROPHY_EARNED, bits(unknown)]],
    });
    expect(readTrophies(units).at(-1)).toEqual({
      key: unknown,
      tab: "other",
      dlc: undefined,
      quantity: undefined,
      earned: true,
      seen: false,
    });
  });
});

describe("the trophy list", () => {
  it("holds each badge once, base game before Endless Ragnarok", () => {
    const keys = TROPHIES.map(([key]) => key);
    expect(new Set(keys).size).toBe(keys.length);
    const dlc = TROPHIES.map(([, , isDlc]) => isDlc);
    expect(dlc).toEqual([...dlc].sort((a, b) => Number(a) - Number(b)));
  });

  it("keeps each tab one block per half, Conflux and Summons DLC only", () => {
    for (const half of [false, true]) {
      const tabs = TROPHIES.filter(([, , dlc]) => dlc === half).map(
        ([, tab]) => tab,
      );
      const blocks = tabs.filter((tab, i) => tab !== tabs[i - 1]);
      expect(blocks).toEqual(
        half
          ? [...TROPHY_TABS]
          : ["story", "character", "battle", "gear", "other"],
      );
    }
  });
});
