import { describe, expect, it } from "vitest";
import {
  LOCATION_PARTY_HP,
  LOCATION_SPOT,
  LOCATION_STAGE,
  SAVE_ENTITY,
  SAVE_FEATURE_VERSION,
  SAVE_SLOT_VERSION,
  SYSTEM_PLAY_TIME,
  USER_COMMENDATIONS,
  USER_MASTERY_POINTS,
  USER_ONLINE_STATUS_FLAGS,
  USER_PLAYER_NAME,
  USER_RUPIES,
} from "../../src/domains/user/attributes";
import { maxMasteryPoints, maxRupies } from "../../src/domains/user/edit";
import { readSystem, readUser } from "../../src/domains/user/read";
import { SaveSession } from "../../src/save/session";
import { fixtureFile, unitStore } from "../../src/testing";

/** Text is stored as char codes, terminated by a zero. */
const text = (value: string) =>
  [...value].map((c) => c.charCodeAt(0)).concat(0);

describe("readUser", () => {
  it("reads the save-wide values off the one entity that holds them", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [SAVE_SLOT_VERSION, 1],
        [SAVE_FEATURE_VERSION, 4],
        [USER_PLAYER_NAME, text("Gran")],
        [USER_COMMENDATIONS, 17],
        [USER_ONLINE_STATUS_FLAGS, 3],
        [LOCATION_STAGE, 0x0a001001],
        [LOCATION_SPOT, text("spot")],
        // Only the player's own party slot carries HP.
        [LOCATION_PARTY_HP, [0, 0, 1234, 0]],
      ],
    });
    expect(readUser(units)).toEqual({
      slotVersion: 1,
      featureVersion: 4,
      playerName: "Gran",
      commendations: 17,
      onlineStatusFlags: 3,
      stage: "0A001001",
      spot: "spot",
      partyHp: 1234,
    });
  });

  it("separates a save holding no versions from one holding zeroes", () => {
    const user = readUser(unitStore());
    expect(user.slotVersion).toBeUndefined();
    expect(user.featureVersion).toBeUndefined();
    expect(user.stage).toBeUndefined();
    expect(user.partyHp).toBe(0);
  });
});

describe("readSystem", () => {
  it("reads play time as seconds", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[SYSTEM_PLAY_TIME, 123_456n]],
    });
    expect(readSystem(units)).toEqual({ playTime: 123_456 });
  });
});

describe("maxRupies and maxMasteryPoints", () => {
  const open = (rupies: number, msp: number) =>
    SaveSession.open(
      fixtureFile({
        [SAVE_ENTITY]: [
          [USER_RUPIES, rupies],
          [USER_MASTERY_POINTS, msp],
        ],
      }),
    );

  it("sets each to the game's cap, leaving the other", () => {
    const session = open(5, 7);
    maxRupies(session);
    const at = session.save.slotData.units.of(SAVE_ENTITY);
    expect([at.get(USER_RUPIES), at.get(USER_MASTERY_POINTS)]).toEqual([
      999999999, 7,
    ]);
    maxMasteryPoints(session);
    expect(at.get(USER_MASTERY_POINTS)).toBe(9999999);
  });

  it("refuses a value already at the cap", () => {
    expect(() => maxRupies(open(999999999, 0))).toThrow("already");
    expect(() => maxMasteryPoints(open(0, 9999999))).toThrow("already");
  });
});
