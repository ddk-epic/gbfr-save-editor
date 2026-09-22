import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
} from "../../src/domains/fate-episode/attributes";
import { readFateEpisodes } from "../../src/domains/fate-episode/read";
import { validateFateEpisodes } from "../../src/domains/fate-episode/validate";
import { unitStore } from "../../src/testing";

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
