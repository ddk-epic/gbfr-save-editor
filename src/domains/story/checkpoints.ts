import { hashId } from "../../core/xxhash32-custom";

/** What one chapter start adds to the checkpoint before it. */
export interface StoryCheckpoint {
  /** `chapter_select.Key`. */
  key: number;
  quest: number;
  /** `BeginSection` guids of `quest`, the first one written. */
  sections: readonly [number, ...number[]];
  town: number;
  townCheckpoint: number;
  cleared: readonly number[];
  chapterKeys: readonly number[];
  chapterGroups: readonly number[];
  trophies: readonly number[];
  /** `TROPHY_PROGRESS` index and the value it holds at this checkpoint. */
  trophyProgress: readonly (readonly [number, bigint])[];
  tutorialWindows: readonly number[];
  tutorialMenus: readonly number[];
  /** Tip key hash and the flags it holds at this checkpoint. */
  tips: readonly (readonly [number, number])[];
}

/** In story order. */
export const STORY_CHECKPOINTS: readonly StoryCheckpoint[] = [
  {
    key: 40,
    quest: 0x101f00,
    sections: [1299620138, 18604228],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [
      0x100000, 0x100001, 0x100002, 0x100003, 0x100005, 0x100006, 0x101000,
    ],
    chapterKeys: [0, 1, 20, 21, 22],
    chapterGroups: [0, 1],
    trophies: [1, 1405],
    trophyProgress: [
      [2, 4n],
      [501, 1n],
      [1018, 1n],
    ],
    tutorialWindows: [hashId("TU_MAP")],
    tutorialMenus: [hashId("TUTORIAL_MAP"), hashId("TUTORIAL_PAD_ASSSGN")],
    tips: [
      [594130054, 3],
      [2065024838, 3],
    ],
  },
];
