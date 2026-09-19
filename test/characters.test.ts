import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  characterOrder,
  readCharacterData,
  readSave,
  type CharacterData,
} from "../src/index";

// Local save, gitignored. Any save works: these hold at every point of progress.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readCharacterData", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const data: CharacterData = hasSave
    ? readCharacterData(readSave(readFileSync(SAVE_PATH)).slotData.units)
    : (undefined as never);
  const warnings = warn.mock.calls.map((args) => String(args[0]));
  warn.mockRestore();
  const known = (key: string | undefined) =>
    key !== undefined && characterOrder(key) < Infinity;

  it("resolves every hash in the save", () => {
    expect(warnings).toEqual([]);
  });

  it("reads the party and loadouts against the character list", () => {
    expect(data.characters.length).toBeGreaterThan(0);
    expect(data.party).toHaveLength(4);
    expect(
      data.party.filter((key) => key !== undefined && !known(key)),
    ).toEqual([]);
    expect(data.summons).toHaveLength(4);
    expect(data.loadouts.filter((l) => !known(l.character))).toEqual([]);
  });

  it("reads masteries that add up", () => {
    for (const character of data.characters)
      for (const [name, section] of Object.entries(character.masteries)) {
        const where = `${character.character} ${name}`;
        const taken = section.nodes.filter((node) => node.taken);
        // taken and msp are counted off the same nodes the section lists, so a
        // bit read against the wrong node shows up here.
        expect(section.taken, where).toBe(taken.length);
        expect(section.msp, where).toBe(
          taken.reduce((sum, node) => sum + node.msp, 0),
        );
        expect(section.taken, where).toBeLessThanOrEqual(section.total);
      }
  });

  it("reads master trait points within their pools", () => {
    // The tree pays out 10 cells at each of r1-r3 and 20 at ex. Perks are lit
    // by those cells rather than bought, so they have no pool of their own.
    const pools = { r1: 10, r2: 10, r3: 10, ex: 20 };
    for (const character of data.characters) {
      const chosen = character.masterTraits.filter((t) => t.chosen && !t.perk);
      for (const [rank, pool] of Object.entries(pools))
        expect(
          chosen.filter((t) => t.rank === rank).length,
          `${character.character} ${rank}`,
        ).toBeLessThanOrEqual(pool);
    }
  });

  it("reads four over-mastery lines at levels 1 to 10", () => {
    for (const character of data.characters) {
      expect(character.overMasteries, character.character).toHaveLength(4);
      for (const line of character.overMasteries.filter(Boolean)) {
        expect(line!.key, character.character).not.toMatch(/^#/);
        expect(line!.level, character.character).toBeGreaterThanOrEqual(1);
        expect(line!.level, character.character).toBeLessThanOrEqual(10);
      }
    }
  });

  it("reads each fate episode once", () => {
    for (const character of data.characters) {
      const keys = character.fateEpisodes.map((episode) => episode.key);
      expect(new Set(keys).size, character.character).toBe(keys.length);
    }
  });
});
