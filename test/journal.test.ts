import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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

  it("reads the five field note categories", () => {
    const entries = readFieldNotes(units);
    const of = (category: string) =>
      entries.filter((e) => e.category === category);
    expect(entries.filter((e) => e.key.startsWith("#"))).toEqual([]);
    expect([...new Set(entries.map((e) => e.category))]).toEqual([
      ...["characters", "foes", "weapons"],
      ...["treasure", "wrightstones"],
    ]);
    // Weapons and Treasure cover the rows of the lists they draw from.
    expect(of("weapons").map((e) => e.key)).toEqual([...FIELD_NOTE_WEAPONS]);
    expect(of("treasure").map((e) => e.key)).toEqual([...FIELD_NOTE_TREASURE]);
    // Only Treasure has a seen bit; the other four leave it undecoded.
    const seen = (e: (typeof entries)[number]) => e.seen !== undefined;
    expect(
      entries.filter((e) => seen(e) !== (e.category === "treasure")),
    ).toEqual([]);
  });

  it("reads one trophy per badge, earned or not", () => {
    const trophies = readTrophies(units);
    expect(trophies.map((t) => t.key)).toEqual(TROPHIES.map(([key]) => key));
  });

  it("marks only earned trophies seen", () => {
    expect(readTrophies(units).filter((t) => t.seen && !t.earned)).toEqual([]);
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
