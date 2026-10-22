import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
} from "../../src/domains/fate-episode/attributes";
import { completeFateEpisodes } from "../../src/domains/fate-episode/edit";
import { readFateEpisodes } from "../../src/domains/fate-episode/read";
import { validateFateEpisodes } from "../../src/domains/fate-episode/validate";
import {
  ITEM_ACQUIRED,
  ITEM_ACQUIRED_LAST,
  ITEM_COUNT,
  ITEM_FLAGS,
  ITEM_KEY,
} from "../../src/domains/item/attributes";
import {
  ARCHIVE_FLAGS,
  ARCHIVE_KEY,
} from "../../src/domains/journal/attributes";
import {
  FATE_QUEST_CLEARED,
  FATE_QUEST_IDS,
} from "../../src/domains/quest/attributes";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile, unitStore, type EntityUnits } from "../../src/testing";

describe("readFateEpisodes", () => {
  it("groups episodes by character in save order, leaving out untitled ones", () => {
    const units = unitStore({
      1: [
        [FATE_EPISODE_KEY, hashId("FATE_PL0500_01")],
        [FATE_EPISODE_STATE, 8],
      ],
      2: [[FATE_EPISODE_KEY, hashId("FATE_PL1600_00")]],
      // Stored, but the menu does not list REMI_* episodes.
      3: [[FATE_EPISODE_KEY, hashId("REMI_PL0500_00")]],
    });
    expect(Object.fromEntries(readFateEpisodes(units))).toEqual({
      PL0500: [{ key: "FATE_PL0500_01", completed: true }],
      PL1600: [{ key: "FATE_PL1600_00", completed: false }],
    });
  });
});

describe("validateFateEpisodes", () => {
  const episode = (key: string) => ({ key, completed: true });

  it("passes a character's episodes listed once each", () => {
    expect(validateFateEpisodes("PL0500", ["a", "b"].map(episode))).toEqual([]);
  });

  it("warns on an episode listed twice, naming it once", () => {
    expect(validateFateEpisodes("PL0500", ["a", "a"].map(episode))).toEqual([
      {
        severity: "warning",
        code: "duplicateFateEpisode",
        character: "PL0500",
        key: "a",
      },
    ]);
  });
});

describe("completeFateEpisodes", () => {
  const episode = (key: string, state: number): EntityUnits => [
    [FATE_EPISODE_KEY, hashId(key)],
    [FATE_EPISODE_STATE, state],
  ];
  const ITEM = 7;
  const ARCHIVE = 3;
  const open = (extra: Record<number, EntityUnits> = {}) =>
    SaveSession.open(
      fixtureFile({
        0: [
          [FATE_QUEST_IDS, [0x300006, 0x301006]],
          [FATE_QUEST_CLEARED, [0, 0]],
          [ITEM_ACQUIRED_LAST, 500],
        ],
        [ITEM]: [
          [ITEM_KEY, hashId("ITEM_70_0011")],
          [ITEM_COUNT, 0],
          [ITEM_FLAGS, 0],
          [ITEM_ACQUIRED, 0],
        ],
        [ARCHIVE]: [
          [ARCHIVE_KEY, hashId("ARC_OTHER_045")],
          [ARCHIVE_FLAGS, 0],
        ],
        ...extra,
      }),
    );

  it("completes each episode, keeping bit 2 and revealing the locked ones", () => {
    const session = open({
      66: episode("FATE_PL0600_00", 30),
      67: episode("FATE_PL0600_01", 20),
      68: episode("FATE_PL0600_02", 21),
      69: episode("FATE_PL0600_03", 5),
      70: episode("FATE_PL0600_04", 1),
      // A default-unlocked episode without bit 4 stays without it.
      71: episode("FATE_PL0600_05", 4),
      // Another character's.
      82: episode("FATE_PL0700_00", 5),
    });
    completeFateEpisodes(session, "PL0600");
    const units = session.save.slotData.units;
    expect(
      [66, 67, 68, 69, 70, 71, 82].map(
        (entity) => units.values(FATE_EPISODE_STATE, entity)![0],
      ),
    ).toEqual([30, 30, 30, 30, 26, 14, 5]);
  });

  it("clears the fate quest, grants the item reward and unlocks the archive", () => {
    const session = open({
      74: episode("FATE_PL0600_08", 5),
      75: episode("FATE_PL0600_09", 5),
      76: episode("FATE_PL0600_10", 5),
    });
    completeFateEpisodes(session, "PL0600");
    const units = session.save.slotData.units;
    expect(units.values(FATE_QUEST_CLEARED, 0)).toEqual([0, 1]);
    expect(
      [ITEM_COUNT, ITEM_FLAGS, ITEM_ACQUIRED].map(
        (attribute) => units.values(attribute, ITEM)![0],
      ),
    ).toEqual([1, 36, 501]);
    expect(units.values(ITEM_ACQUIRED_LAST, 0)).toEqual([501]);
    expect(units.values(ARCHIVE_FLAGS, ARCHIVE)).toEqual([1]);
  });

  it("grants nothing for an episode already completed", () => {
    const session = open({
      75: episode("FATE_PL0600_09", 30),
      76: episode("FATE_PL0600_10", 20),
    });
    completeFateEpisodes(session, "PL0600");
    const units = session.save.slotData.units;
    expect(units.values(ITEM_COUNT, ITEM)).toEqual([0]);
    expect(units.values(ITEM_ACQUIRED_LAST, 0)).toEqual([500]);
    expect(units.values(ARCHIVE_FLAGS, ARCHIVE)).toEqual([1]);
  });

  it("refuses a character with nothing left to complete", () => {
    const session = open({ 66: episode("FATE_PL0600_00", 30) });
    expect(() => completeFateEpisodes(session, "PL0600")).toThrow(
      "no fate episode left",
    );
    expect(() => completeFateEpisodes(session, "PL9999")).toThrow(
      "no fate episode left",
    );
  });
});
