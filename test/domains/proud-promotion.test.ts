import { describe, expect, it } from "vitest";
import { CAPTAIN } from "../../packages/character/attributes";
import type { Attribute } from "../../packages/core";
import { readSave } from "../../packages/core/read-save";
import { ITEM_ACQUIRED_LAST } from "../../packages/item/attributes";
import {
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
} from "../../packages/profile/attributes";
import {
  COUNTER_QUEST_CLEARED,
  COUNTER_QUEST_CLEARS,
  COUNTER_QUEST_FLAGS,
  COUNTER_QUEST_IDS,
  COUNTER_QUEST_OPENED,
  QUEST_RANK_REWARDED,
  QUEST_DIFFICULTY_UNLOCKED,
  STORY_CUTSCENE_CHECKPOINTS,
  STORY_CUTSCENE_CLEARS,
  STORY_CUTSCENE_IDS,
} from "../../packages/quest/attributes";
import {
  BETWEEN_STORY_QUESTS,
  CHAPTER_BEST_DIFFICULTY,
  CHAPTER_GROUP_FLAGS,
  CHAPTER_GROUPS,
  CHAPTER_KEYS,
  CHAPTER_ULTIMATE_CLEARED,
  CHAPTER_ULTIMATE_CLEARS,
  CURRENT_CHAPTER,
  STORY_QUEST_CHECKPOINTS,
  STORY_QUEST_CHECKPOINTS_LIVE,
  STORY_QUEST_CLEARED,
  STORY_QUEST_IDS,
  STORY_QUEST_LIVE_CLEARED,
  STORY_QUEST_THIRD_CLEARED,
  SYSTEM_STORY_DIFFICULTY,
  UI_FEATURE_UNLOCKED,
} from "../../packages/story/attributes";
import { advanceStory, storyTargets } from "../../packages/story/edit";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "../../packages/trophy/attributes";
import { SAVE_HASHSEED } from "../../packages/core/save-entity";
import { USER_RUPIES } from "../../packages/user/attributes";
import { WEAPON_LAST_ID } from "../../packages/weapon/attributes";
import { SaveSession } from "../../packages/core/session";
import { fixtureFile } from "../../packages/gbfr-save-editor/testing";

const MANIAC_QUESTS = [
  0x406325, 0x406330, 0x406331, 0x406332, 0x406333, 0x406334, 0x406335,
  0x406337, 0x406338, 0x406355, 0x406356, 0x406357, 0x406358, 0x406359,
  0x406360, 0x406364, 0x406365, 0x406366,
];
const LISTED_ONLY = 0x406361;
const PROMOTION = 0x407101;
const NEVER_LISTED = 0x406367;
const ROWS = MANIAC_QUESTS.length + 3;
const CHAPTER_ZERO_END_SECTION = 1845682248;
/** Key 222 with `0010A031` underway, or cleared. */
const chapterZeroEnd = (cleared = 0): [Attribute<number[]>, number[]][] => [
  [CURRENT_CHAPTER, [222, -1]],
  [STORY_QUEST_IDS, [0x10a031]],
  [STORY_QUEST_CLEARED, [cleared]],
  [STORY_QUEST_LIVE_CLEARED, [1 - cleared]],
  [STORY_QUEST_THIRD_CLEARED, [cleared]],
  [
    STORY_QUEST_CHECKPOINTS,
    [cleared ? 0 : CHAPTER_ZERO_END_SECTION, ...Array<number>(199).fill(0)],
  ],
  [
    STORY_QUEST_CHECKPOINTS_LIVE,
    [cleared ? 0 : CHAPTER_ZERO_END_SECTION, ...Array<number>(199).fill(0)],
  ],
  [CHAPTER_KEYS, [221]],
  [CHAPTER_BEST_DIFFICULTY, [1]],
  [CHAPTER_ULTIMATE_CLEARED, [0]],
  [CHAPTER_ULTIMATE_CLEARS, [0]],
  [CHAPTER_GROUPS, [10]],
  [CHAPTER_GROUP_FLAGS, [0]],
];

const roomy = (bytes: Uint8Array) => {
  const copy = new Uint8Array(bytes.length + 4096);
  copy.set(bytes);
  return copy;
};

const targets = (session: SaveSession) =>
  storyTargets(session.save).map(({ id }) => id);

const save = (difficulty: number) =>
  SaveSession.open(
    roomy(
      fixtureFile(
        {
          0: [
            [SAVE_HASHSEED, 23],
            ...chapterZeroEnd(),
            [BETWEEN_STORY_QUESTS, 0],
            [QUEST_DIFFICULTY_UNLOCKED, difficulty],
            [QUEST_RANK_REWARDED, 0],
            [TROPHY_EARNED, Array<boolean>(1700).fill(false)],
            [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
            [UI_FEATURE_UNLOCKED, Array<boolean>(128).fill(false)],
            [STORY_CUTSCENE_IDS, [0]],
            [STORY_CUTSCENE_CLEARS, [0]],
            [STORY_CUTSCENE_CHECKPOINTS, Array<number>(64).fill(0)],
            [
              COUNTER_QUEST_IDS,
              [LISTED_ONLY, ...MANIAC_QUESTS, PROMOTION, NEVER_LISTED],
            ],
            [COUNTER_QUEST_CLEARS, Array<number>(ROWS).fill(0)],
            [COUNTER_QUEST_FLAGS, Array<number>(ROWS).fill(7)],
            [COUNTER_QUEST_OPENED, Array<boolean>(ROWS).fill(false)],
            [COUNTER_QUEST_CLEARED, Array<boolean>(ROWS).fill(false)],
            [ITEM_ACQUIRED_LAST, 7],
            [WEAPON_LAST_ID, 3],
            [CAPTAIN, 1],
            [USER_RUPIES, 1000],
          ],
          [PROFILE_FIRST]: [[PROFILE_QUESTS_CLEARED, 3]],
        },
        { 0: [[SYSTEM_STORY_DIFFICULTY, 1]] },
      ),
    ),
  );

describe("promoteToProud", () => {
  it("clears the quests up to the promotion and unlocks Proud quests", () => {
    const session = save(6);
    advanceStory(session, "promoteToProud");
    const units = readSave(session.export()).slotData.units;
    const at = units.of(0);

    expect(at.get(COUNTER_QUEST_CLEARS)).toEqual([
      0,
      ...MANIAC_QUESTS.map(() => 1),
      1,
      0,
    ]);
    expect(at.get(COUNTER_QUEST_FLAGS)[0]).toBe(7);
    expect(at.get(COUNTER_QUEST_OPENED)[0]).toBe(true);
    expect(at.get(COUNTER_QUEST_CLEARED)[0]).toBe(false);
    expect(at.get(COUNTER_QUEST_OPENED)[ROWS - 1]).toBe(false);
    expect(at.get(QUEST_DIFFICULTY_UNLOCKED)).toBe(7);
    expect(at.get(TROPHY_PROGRESS)[19]).toBe(18n);
    expect(at.get(TROPHY_PROGRESS)[238]).toBe(1n);
    expect(at.get(TROPHY_PROGRESS)[20]).toBe(19n);
    expect(units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED)).toBe(22);
  });

  it("clears 0010A031 as the first Maniac clear does", () => {
    const session = save(6);
    advanceStory(session, "promoteToProud");
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(STORY_QUEST_CLEARED)).toEqual([1]);
    expect(at.get(STORY_QUEST_THIRD_CLEARED)).toEqual([1]);
    expect(at.get(STORY_QUEST_LIVE_CLEARED)).toEqual([0]);
    expect(at.get(STORY_QUEST_CHECKPOINTS)[0]).toBe(0);
    expect(at.get(STORY_QUEST_CHECKPOINTS_LIVE)[0]).toBe(0);
    expect(at.get(BETWEEN_STORY_QUESTS)).toBe(1);
    expect(at.get(CURRENT_CHAPTER)).toEqual([222, -1]);
    expect(at.get(CHAPTER_KEYS)).toEqual([221, 222]);
    expect(at.get(CHAPTER_GROUPS)).toEqual([10, 11]);
    expect(at.get(CHAPTER_GROUP_FLAGS)).toEqual([0, 1]);
  });

  it("leaves the rewards and trophies to the fill", () => {
    const session = save(6);
    advanceStory(session, "promoteToProud");
    const at = session.save.slotData.units.of(0);
    expect(at.get(USER_RUPIES)).toBe(1000);
    expect(at.get(TROPHY_PROGRESS)[224]).toBe(0n);
    expect(at.get(TROPHY_EARNED)[542]).toBe(false);
  });

  it("keeps a quest already cleared", () => {
    const session = save(6);
    const at = session.save.slotData.units.of(0);
    const clears = [...at.get(COUNTER_QUEST_CLEARS)];
    clears[1] = 4;
    session.patch([
      { attribute: COUNTER_QUEST_CLEARS, entity: 0, values: clears },
    ]);
    advanceStory(session, "promoteToProud");
    expect(at.get(COUNTER_QUEST_CLEARS)[1]).toBe(4);
    expect(at.get(TROPHY_PROGRESS)[19]).toBe(17n);
  });

  it("is offered at Maniac, and at Proud with a Maniac quest not listed", () => {
    expect(targets(save(6))[0]).toBe("promoteToProud");
    const session = save(7);
    expect(targets(session)[0]).toBe("promoteToProud");
    advanceStory(session, "promoteToProud");
    const at = session.save.slotData.units.of(0);
    expect(at.get(COUNTER_QUEST_OPENED)[0]).toBe(true);
    expect(at.get(QUEST_DIFFICULTY_UNLOCKED)).toBe(7);
    expect(targets(session)).not.toContain("promoteToProud");
  });
});

describe("unlockProudQuests", () => {
  const PREREQUISITES = [
    0x407301, 0x407302, 0x407303, 0x407304, 0x407310, 0x407311, 0x407312,
    0x407313, 0x407314, 0x407315, 0x407316, 0x407317, 0x407318, 0x407319,
    0x407320,
  ];
  const proudSave = () =>
    SaveSession.open(
      roomy(
        fixtureFile({
          0: [
            [SAVE_HASHSEED, 23],
            ...chapterZeroEnd(1),
            [BETWEEN_STORY_QUESTS, 1],
            [QUEST_DIFFICULTY_UNLOCKED, 7],
            [QUEST_RANK_REWARDED, 6],
            [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
            [STORY_CUTSCENE_IDS, [0x705001, 0x710000, 0x710001]],
            [STORY_CUTSCENE_CLEARS, [0, 0, 0]],
            [
              STORY_CUTSCENE_CHECKPOINTS,
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
      ),
    );

  it("clears the quests that open others, and only once", () => {
    const session = proudSave();
    advanceStory(session, "unlockProudQuests");
    const at = readSave(session.export()).slotData.units.of(0);

    expect(at.get(COUNTER_QUEST_CLEARS)).toEqual([
      0,
      ...PREREQUISITES.map(() => 1),
    ]);
    expect(at.get(COUNTER_QUEST_OPENED)).toEqual(Array(16).fill(true));
    expect(at.get(COUNTER_QUEST_CLEARED)[0]).toBe(false);
    expect(at.get(STORY_CUTSCENE_CLEARS)).toEqual([0, 1, 1]);
    expect(at.get(STORY_CUTSCENE_CHECKPOINTS)[0]).toBe(77);
    expect(at.get(STORY_CUTSCENE_CHECKPOINTS)[128]).toBe(0);
    expect(at.get(TROPHY_PROGRESS)[238]).toBe(15n);
    expect(at.get(TROPHY_PROGRESS)[20]).toBe(15n);

    expect(() => advanceStory(session, "unlockProudQuests")).toThrow(
      "already at or past",
    );
  });

  it("is offered until nothing is left to clear", () => {
    const session = proudSave();
    expect(targets(session)[0]).toBe("unlockProudQuests");
    advanceStory(session, "unlockProudQuests");
    expect(targets(session)).not.toContain("unlockProudQuests");
  });

  it("is offered on a save with every prerequisite cleared and a quest not listed", () => {
    const session = proudSave();
    advanceStory(session, "unlockProudQuests");
    const at = session.save.slotData.units.of(0);
    const opened = [...at.get(COUNTER_QUEST_OPENED)];
    opened[0] = false;
    session.patch([
      { attribute: COUNTER_QUEST_OPENED, entity: 0, values: opened },
    ]);

    expect(targets(session)[0]).toBe("unlockProudQuests");
    advanceStory(session, "unlockProudQuests");
    expect(at.get(COUNTER_QUEST_OPENED)[0]).toBe(true);
    expect(targets(session)).not.toContain("unlockProudQuests");
  });
});
