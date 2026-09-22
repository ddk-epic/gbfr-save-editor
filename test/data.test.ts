// Completeness of the generated tables in src/data.

import { describe, expect, it } from "vitest";
import { STORY_KEYS, STORY_ORDER } from "../src/data/journal";
import { QUEST_COUNTER } from "../src/data/quests";
import { TROPHIES, TROPHY_TABS } from "../src/data/trophies";

describe("STORY_ORDER", () => {
  it("places every story row", () => {
    // A row left out lands after the others as chapter 0.
    const placed = new Set(STORY_ORDER.map(([key]) => key));
    expect(Object.values(STORY_KEYS).filter((key) => !placed.has(key))).toEqual(
      [],
    );
  });

  it("runs by chapter, 0 The Story So Far through 14 the Epilogue", () => {
    const chapters = STORY_ORDER.map(([, chapter]) => chapter);
    expect(chapters).toEqual([...chapters].sort((a, b) => a - b));
    expect(chapters[0]).toBe(0);
    expect(chapters.at(-1)).toBe(14);
  });
});

describe("QUEST_COUNTER", () => {
  const ids = QUEST_COUNTER.map(([id]) => id);

  it("lists every quest once, one unbroken run per difficulty", () => {
    expect(ids.length).toBeGreaterThan(0);
    // A duplicate id drops a quest out of the order.
    expect(new Set(ids).size).toBe(ids.length);
    // Each difficulty holds one unbroken run.
    const runs = ids
      .map((id) => id[4])
      .filter((digit, i, all) => digit !== all[i - 1]);
    expect(new Set(runs).size).toBe(runs.length);
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
