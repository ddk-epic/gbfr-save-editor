import { describe, expect, it } from "vitest";
import { readSave } from "../../src/core/read-save";
import { ITEM_ACQUIRED_LAST } from "../../src/domains/item/attributes";
import {
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
} from "../../src/domains/profile/attributes";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  QUEST_DIFFICULTY_UNLOCKED,
  SHORT_STORY_CHECKPOINTS,
  SHORT_STORY_CLEARS,
  SHORT_STORY_IDS,
} from "../../src/domains/quest/attributes";
import { UI_FEATURE_UNLOCKED } from "../../src/domains/story/attributes";
import {
  canPromoteToProud,
  canUnlockProudQuests,
  promoteToProud,
  unlockProudQuests,
} from "../../src/domains/story/fill";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../src/domains/trophy/attributes";
import {
  SAVE_HASHSEED,
  USER_CAPTAIN,
  USER_RUPIES,
} from "../../src/domains/user/attributes";
import { WEAPON_LAST_ID } from "../../src/domains/weapon/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile } from "../../src/testing";

const MANIAC_QUESTS = [
  0x406325, 0x406330, 0x406331, 0x406332, 0x406333, 0x406334, 0x406335,
  0x406337, 0x406338, 0x406355, 0x406356, 0x406357, 0x406358, 0x406359,
  0x406360, 0x406364, 0x406365, 0x406366,
];
const LISTED_ONLY = 0x406361;
const PROMOTION = 0x407101;
const ROWS = MANIAC_QUESTS.length + 2;

const save = (difficulty: number) =>
  SaveSession.open(
    fixtureFile({
      0: [
        [SAVE_HASHSEED, 23],
        [QUEST_DIFFICULTY_UNLOCKED, difficulty],
        [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
        [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
        [UI_FEATURE_UNLOCKED, Array<boolean>(128).fill(false)],
        [SHORT_STORY_IDS, [0]],
        [SHORT_STORY_CLEARS, [0]],
        [SHORT_STORY_CHECKPOINTS, Array<number>(64).fill(0)],
        [COUNTER_QUEST_IDS, [LISTED_ONLY, ...MANIAC_QUESTS, PROMOTION]],
        [COUNTER_QUEST_CLEARS, Array<number>(ROWS).fill(0)],
        [COUNTER_QUEST_FLAGS, Array<number>(ROWS).fill(7)],
        [COUNTER_QUEST_OPENED, Array<boolean>(ROWS).fill(false)],
        [COUNTER_QUEST_CLEARED, Array<boolean>(ROWS).fill(false)],
        [ITEM_ACQUIRED_LAST, 7],
        [WEAPON_LAST_ID, 3],
        [USER_CAPTAIN, 1],
        [USER_RUPIES, 1000],
      ],
      [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 3]],
    }),
  );

describe("promoteToProud", () => {
  it("clears the quests up to the promotion and unlocks Proud quests", () => {
    const session = save(6);
    promoteToProud(session);
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(COUNTER_QUEST_CLEARS)).toEqual([
      0,
      ...MANIAC_QUESTS.map(() => 1),
      1,
    ]);
    expect(at.get(COUNTER_QUEST_FLAGS)[0]).toBe(7);
    expect(at.get(COUNTER_QUEST_OPENED)[0]).toBe(false);
    expect(at.get(QUEST_DIFFICULTY_UNLOCKED)).toBe(7);
    expect(at.get(TROPHY_EARNED)[542]).toBe(true);
    expect(at.get(TROPHY_PROGRESS)[19]).toBe(18n);
    expect(at.get(TROPHY_PROGRESS)[238]).toBe(1n);
    expect(at.get(TROPHY_PROGRESS)[20]).toBe(19n);
    expect(units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED)).toBe(22);
  });

  it("leaves the rewards to the game and changes nothing on a second run", () => {
    const session = save(6);
    promoteToProud(session);
    const at = session.save.slotData.units.of(0);
    expect(at.get(USER_RUPIES)).toBe(1000);
    expect(at.get(TROPHY_PROGRESS)[224]).toBe(0n);

    const first = session.export();
    expect(promoteToProud(session)).toEqual([]);
    expect(session.export()).toEqual(first);
  });

  it("keeps a quest already cleared", () => {
    const session = save(6);
    const at = session.save.slotData.units.of(0);
    const clears = [...at.get(COUNTER_QUEST_CLEARS)];
    clears[1] = 4;
    session.patch([
      { attribute: COUNTER_QUEST_CLEARS, entity: 0, values: clears },
    ]);
    promoteToProud(session);
    expect(at.get(COUNTER_QUEST_CLEARS)[1]).toBe(4);
    expect(at.get(TROPHY_PROGRESS)[19]).toBe(17n);
  });

  it("refuses a save without Maniac quests", () => {
    expect(() => promoteToProud(save(5))).toThrow("Maniac");
  });
});

describe("canPromoteToProud", () => {
  it("holds only at Maniac", () => {
    expect(canPromoteToProud(save(5).save)).toBe(false);
    expect(canPromoteToProud(save(6).save)).toBe(true);
    expect(canPromoteToProud(save(7).save)).toBe(false);
  });

  it("ends with the promotion", () => {
    const session = save(6);
    promoteToProud(session);
    expect(canPromoteToProud(session.save)).toBe(false);
  });
});

describe("unlockProudQuests", () => {
  const PREREQUISITES = [
    0x407301, 0x407302, 0x407303, 0x407304, 0x407310, 0x407311, 0x407312,
    0x407313, 0x407314, 0x407315, 0x407316, 0x407317, 0x407318, 0x407319,
    0x407320,
  ];
  const proudSave = (difficulty: number) =>
    SaveSession.open(
      fixtureFile({
        0: [
          [SAVE_HASHSEED, 23],
          [QUEST_DIFFICULTY_UNLOCKED, difficulty],
          [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
          [SHORT_STORY_IDS, [0x705001, 0x710000, 0x710001]],
          [SHORT_STORY_CLEARS, [0, 0, 0]],
          [
            SHORT_STORY_CHECKPOINTS,
            Array.from({ length: 192 }, (_, index) =>
              index === 128 || index === 0 ? 77 : 0,
            ),
          ],
          [COUNTER_QUEST_IDS, [0x407321, ...PREREQUISITES]],
          [COUNTER_QUEST_CLEARS, Array<number>(16).fill(0)],
          [COUNTER_QUEST_FLAGS, Array<number>(16).fill(7)],
          [COUNTER_QUEST_OPENED, Array<boolean>(16).fill(false)],
          [COUNTER_QUEST_CLEARED, Array<boolean>(16).fill(false)],
        ],
        [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 3]],
      }),
    );

  it("clears the quests that open others, and only once", () => {
    const session = proudSave(7);
    expect(unlockProudQuests(session)).toHaveLength(17);
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(COUNTER_QUEST_CLEARS)).toEqual([
      0,
      ...PREREQUISITES.map(() => 1),
    ]);
    expect(at.get(SHORT_STORY_CLEARS)).toEqual([0, 1, 1]);
    expect(at.get(SHORT_STORY_CHECKPOINTS)[0]).toBe(77);
    expect(at.get(SHORT_STORY_CHECKPOINTS)[128]).toBe(0);
    expect(at.get(TROPHY_PROGRESS)[238]).toBe(15n);
    expect(at.get(TROPHY_PROGRESS)[20]).toBe(15n);

    const first = session.export();
    expect(unlockProudQuests(session)).toEqual([]);
    expect(session.export()).toEqual(first);
  });

  it("is offered until nothing is left to clear", () => {
    expect(canUnlockProudQuests(proudSave(6).save)).toBe(false);
    const session = proudSave(7);
    expect(canUnlockProudQuests(session.save)).toBe(true);
    unlockProudQuests(session);
    expect(canUnlockProudQuests(session.save)).toBe(false);
  });

  it("refuses a save without Proud quests", () => {
    expect(() => unlockProudQuests(proudSave(6))).toThrow("Proud");
  });
});
