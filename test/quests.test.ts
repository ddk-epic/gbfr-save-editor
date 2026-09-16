import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  readCounterQuests,
  readProfile,
  readSave,
  readSideQuests,
} from "../src/index";

// Local save, gitignored. Counts and names checked in game.
const SAVE_PATH = process.env.GBFR_SAVE ?? "tmp/SaveData1.dat";
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("readSideQuests and readCounterQuests", () => {
  it("reads side quests, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const quests = readSideQuests(units);
    expect(quests).toHaveLength(151);
    // The game lists 141 accepted, 139 completed. Futureproof Trading and
    // Presentproof Investing are completed repeat quests, hidden until
    // accepted again.
    const repeats = ["00204106", "00204107"];
    const listed = quests.filter((q) => q.accepted && !repeats.includes(q.id));
    expect(listed).toHaveLength(141);
    expect(listed.filter((q) => q.completed)).toHaveLength(139);
    // Underway: Eureka! They Do Exist! and Chasing Rumors: Red Tri-Stars.
    expect(listed.filter((q) => !q.completed).map((q) => q.id)).toEqual([
      "00290101",
      "00240121",
    ]);
    expect(
      quests.filter((q) => repeats.includes(q.id)).map((q) => q.completed),
    ).toEqual([true, true]);
    // Save the Crustaceans and its 14 sequels, all completed.
    expect(
      quests.filter((q) => /^0029000|^0029001|^00200001$/.test(q.id)),
    ).toSatisfy(
      (list: typeof quests) =>
        list.length === 15 && list.every((q) => q.completed),
    );
  });

  it("reads quest counter quests, as in game", () => {
    const units = readSave(readFileSync(SAVE_PATH)).slotData.units;
    const quests = readCounterQuests(units);
    const quest = (id: string) => quests.find((q) => q.id === id);
    expect(quests).toHaveLength(203);
    // Clears sum to quests cleared on the profile.
    expect(quests.reduce((sum, q) => sum + q.clears, 0)).toBe(
      readProfile(units).questsCleared,
    );
    // Lock Horns, Throw a Smith a Bone, I See a Grim Vision.
    expect(
      ["00407322", "00406364", "00406360"].map((id) => quest(id)?.clears),
    ).toEqual([4105, 1269, 1245]);
    // S+ best: The Juice of Jealousy, Tomorrow's Prayers, Protect Our Woods.
    // S++ on all five On the Threshold quests.
    expect(
      quests.filter((q) => q.clears && !q.perfectGrade).map((q) => q.id),
    ).toEqual(["00403302", "00401316", "00401315"]);
    expect(
      quests
        .filter((q) => q.id.startsWith("0040B"))
        .every((q) => q.perfectGrade),
    ).toBe(true);
    // On the Threshold of Destruction, last cleared 2026-08-17.
    expect(quest("0040B309")?.lastCleared?.toISOString()).toBe(
      "2026-08-17T01:50:50.000Z",
    );
    expect(quest("00406360")?.lastCleared).toBeUndefined();
  });
});
