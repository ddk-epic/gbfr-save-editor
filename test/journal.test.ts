import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  readArchives,
  readEarnedTrophies,
  readGlossary,
  readMusic,
  readSave,
  readTips,
} from "../src/index";

// Local save, gitignored. Counts and names checked in game.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("the journal and trophies", () => {
  it("reads earned trophies, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const earned = new Set(readEarnedTrophies(units));
    const got = (keys: number[]) => keys.map((key) => earned.has(key));
    expect(earned.size).toBe(981);
    // Narmaya: master level 10, {0} and 50 earned, caps 1-4 and devotion not.
    expect(got([951, 952, 953, 954, 955, 956, 957, 958])).toEqual([
      ...[true, true, true],
      ...[false, false, false, false, false],
    ]);
    // Yodarha: all eight master level trophies.
    expect(got([943, 944, 945, 946, 947, 948, 949, 950])).toEqual(
      Array(8).fill(true),
    );
    // Hidden in game: Perfectly Heroic, Hardcore and the 7 dark wee pincers.
    expect(got([15, 16, 1342, 1343, 1344, 1345, 1466, 1487, 1488])).toEqual(
      Array(9).fill(false),
    );
  });

  it("reads journal archives, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const entries = readArchives(units);
    const count = (prefix: string) => {
      const list = entries.filter((e) => e.key.startsWith(prefix));
      return `${list.filter((e) => e.obtained).length}/${list.length}`;
    };
    // Obtained Documents, Records of a Handyman, Classified Records.
    expect([
      count("ARC_OTHER_"),
      count("ARC_ROLAN"),
      count("ARC_LILITH"),
    ]).toEqual(["57/73", "8/8", "5/5"]);
    // The 8 obtained documents with the new mark.
    expect(
      entries
        .filter((e) => e.obtained && !e.viewed)
        .map((e) => e.key)
        .sort(),
    ).toEqual([45, 46, 66, 67, 68, 69, 71, 72].map((n) => `ARC_OTHER_0${n}`));
    // ???: Fishing Tournament Flyer, Aged Document, Seize the Day, Silver Wolves!
    const entry = (key: string) => entries.find((e) => e.key === key);
    for (const key of ["ARC_OTHER_004", "ARC_OTHER_022", "ARC_OTHER_070"])
      expect(entry(key)).toMatchObject({ obtained: false, viewed: false });
  });

  it("reads the journal glossary, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const entries = new Map(readGlossary(units).map((e) => [e.key, e]));
    const entry = (n: string) => entries.get(`TXT_GLOSSARY_TTL_${n}`);
    expect(entries.size).toBe(146);
    expect([...entries.values()].filter((e) => e.listed).length).toBe(142);
    // Missing in game: Moondwellers, Bluesky Knights, The Order of Vane, Silver Wolf Resurgence.
    for (const n of ["0104", "0096", "0097", "0119"])
      expect(entry(n)).toMatchObject({ listed: false, paragraphs: 0 });
    // Sky Realm 1, Folca 2 and Seedhollow Castle 4 paragraphs.
    expect([entry("0000"), entry("0062"), entry("0075")]).toMatchObject(
      [1, 2, 4].map((paragraphs) => ({
        listed: true,
        viewed: true,
        paragraphs,
      })),
    );
    // Ragnalia and Astrum Fragments show the new mark.
    for (const n of ["0125", "0034"])
      expect(entry(n)).toMatchObject({ listed: true, viewed: false });
  });

  it("reads journal tips, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const tips = new Map(readTips(units).map((tip) => [tip.key, tip]));
    expect(tips.size).toBe(328);
    const all = [...tips.values()];
    expect(all.filter((tip) => tip.listed).length).toBe(320);
    expect(all.filter((tip) => tip.listed && !tip.viewed).length).toBe(26);
    // Missing: Dark Wee Pincers, Block List and Report Function in System, Dexterity's Way 2 and 4 in Conflux.
    for (const key of [
      "FE22112B",
      "CEBF5296",
      "CF168BE2",
      "926889B9",
      "BB9BB8F4",
    ])
      expect(tips.get(key)).toMatchObject({ listed: false });
    // New mark: Mastering the Captain 3 and Damage Cap.
    for (const key of ["B885D317", "72DBE9B8"])
      expect(tips.get(key)).toMatchObject({ listed: true, viewed: false });
  });

  it("reads the journal music collection, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const tracks = new Map(readMusic(units).map((track) => [track.key, track]));
    expect(tracks.size).toBe(194);
    const all = [...tracks.values()];
    expect(all.filter((track) => track.listed).length).toBe(193);
    expect(all.filter((track) => track.listed && !track.viewed).length).toBe(
      99,
    );
    // Missing: Jewel Resort Casino Liner.
    expect(tracks.get("12421797")).toMatchObject({ listed: false });
    // New mark on Wind of Beginnings and The Ultimate, none on Clear Horizons.
    for (const key of ["5D71515A", "95CDEE81"])
      expect(tracks.get(key)).toMatchObject({ listed: true, viewed: false });
    expect(tracks.get("NOTE_BGM_080")).toMatchObject({
      listed: true,
      viewed: true,
    });
  });
});
