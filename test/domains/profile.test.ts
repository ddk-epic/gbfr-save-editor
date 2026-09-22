import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import {
  CARD_CHARACTER_KEY,
  CARD_CHARACTER_LAST_PLAYED,
  CARD_CHARACTER_LEVEL,
  CARD_CHARACTER_MASTER_LEVEL,
  CARD_CHARACTER_MOST_USED,
  CARD_CHARACTER_QUESTS_USED,
  CARD_CHARACTER_STRIDE,
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
} from "../../src/domains/profile/attributes";
import { readProfile } from "../../src/domains/profile/read";
import { unitStore } from "../../src/testing";

/** A card's characters sit at card * 100 + index, not on the card itself. */
const card = (index: number) => PROFILE_FIRST * CARD_CHARACTER_STRIDE + index;

describe("readProfile", () => {
  it("reads the clear count and the card's characters by position", () => {
    const units = unitStore({
      [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 412]],
      [card(CARD_CHARACTER_LAST_PLAYED)]: [
        [CARD_CHARACTER_KEY, hashId("PL0000")],
        [CARD_CHARACTER_LEVEL, 100],
        [CARD_CHARACTER_QUESTS_USED, 300],
        [CARD_CHARACTER_MASTER_LEVEL, 50],
      ],
      [card(CARD_CHARACTER_MOST_USED[1]!)]: [
        [CARD_CHARACTER_KEY, hashId("PL0300")],
        [CARD_CHARACTER_LEVEL, 80],
      ],
    });
    const profile = readProfile(units);

    expect(profile.questsCleared).toBe(412);
    expect(profile.lastPlayed).toEqual({
      entity: card(CARD_CHARACTER_LAST_PLAYED),
      character: "PL0000",
      level: 100,
      questsUsed: 300,
      masterLevel: 50,
    });
    // Most-used slots keep their positions; an empty one reads undefined.
    expect(profile.mostUsed.map((c) => c?.character)).toEqual([
      undefined,
      "PL0300",
      undefined,
    ]);
  });

  it("reads an empty profile as no characters at all", () => {
    const profile = readProfile(unitStore());
    expect(profile.questsCleared).toBe(0);
    expect(profile.lastPlayed).toBeUndefined();
    expect(profile.mostUsed).toEqual([undefined, undefined, undefined]);
  });
});
