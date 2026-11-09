import { hashId } from "@gbfr/core";
import { difficultyDigit } from "@gbfr/quest";

interface CheckpointBase {
  /** Names the checkpoint for `advanceStory` and the fill. */
  id: string;
  /** 7303 digit. */
  questDifficulty?: number;
}

/** What one chapter start adds to the checkpoint before it. */
export interface ChapterCheckpoint extends CheckpointBase {
  /** `chapter_select.Key` the save is at. */
  key: number;
  quest: number;
  /** `BeginSection` guid of `quest` the patch writes. */
  entrySection: number;
  /** `BeginSection` guids the game moves to after a load, identifying a saved checkpoint. */
  laterSections: readonly number[];
  town: number;
  townCheckpoint: number;
  cleared: readonly number[];
  chapterKeys: readonly number[];
  chapterGroups: readonly number[];
  /** `ISLAND_KEY` hashes. */
  islands: readonly number[];
}

/** A step after Chapter Ø that leaves the chapter to the game. */
export interface ProgressCheckpoint extends CheckpointBase {
  /** `chapter_select.Key` the game moves to after the step. */
  key?: number;
  /** Counter quests cleared. */
  counterQuests?: readonly number[];
  /** Counter quests listed: every id under `prefix` apart from `except`. */
  listedQuests?: { prefix: number; except?: readonly number[] };
  shortStories?: readonly number[];
  /** Section hashes the game leaves on short stories not yet begun. */
  shortStorySections?: readonly (readonly [quest: number, hash: number])[];
  /** Side quests completed. */
  sideQuests?: readonly number[];
  /** Section hashes the game leaves on side quests not yet begun. */
  sideQuestSections?: readonly (readonly [quest: number, hash: number])[];
  /** Conflux runs cleared, from the first. */
  confluxCycles?: number;
  /** Where the save loads: 2502, 2503, 2606, 1201 and 1202. */
  location?: { town: number; townCheckpoint: number; spot: string };
}

export type StoryCheckpoint = ChapterCheckpoint | ProgressCheckpoint;

export const isChapterCheckpoint = (
  checkpoint: StoryCheckpoint,
): checkpoint is ChapterCheckpoint => "quest" in checkpoint;

/** `chapter_select.Key`. */
export const CHAPTER_ZERO_END_KEY = 222;
export const EPILOGUE_KEY = 240;

/** In story order. */
export const STORY_CHECKPOINTS: readonly StoryCheckpoint[] = [
  // Start of Chapter 2
  {
    id: "chapter2",
    key: 40,
    quest: 0x101f00,
    entrySection: 1299620138,
    laterSections: [18604228],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [
      0x100000, 0x100001, 0x100002, 0x100003, 0x100005, 0x100006, 0x101000,
    ],
    chapterKeys: [0, 1, 20, 21, 22],
    chapterGroups: [0, 1],
    islands: [hashId("ISLAND_1ST")],
  },
  // Start of Chapter 3
  {
    id: "chapter3",
    key: 60,
    quest: 0x101003,
    entrySection: 2130360527,
    laterSections: [1974310874],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [0x101f00, 0x101001, 0x101002],
    chapterKeys: [40, 41],
    chapterGroups: [2],
    islands: [],
  },
  // Start of Chapter 4
  {
    id: "chapter4",
    key: 80,
    quest: 0x102000,
    entrySection: 240333228,
    laterSections: [1087048104],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [0x101003, 0x101004, 0x101005],
    chapterKeys: [60, 61, 62],
    chapterGroups: [3],
    islands: [],
  },
  // Start of Chapter 5
  {
    id: "chapter5",
    key: 100,
    quest: 0x103001,
    entrySection: 528160042,
    laterSections: [1958916885],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [0x102000, 0x102f00, 0x102002, 0x103f00],
    chapterKeys: [80, 81, 82],
    chapterGroups: [4],
    islands: [hashId("ISLAND_2ST"), hashId("ISLAND_3ST")],
  },
  // Start of Chapter 6
  {
    id: "chapter6",
    key: 120,
    quest: 0x104000,
    entrySection: 1222948280,
    laterSections: [393694498],
    town: 0xd00,
    townCheckpoint: 821073149,
    cleared: [0x103001, 0x104f00],
    chapterKeys: [100, 101, 102, 103, 104],
    chapterGroups: [5],
    islands: [],
  },
  // Start of Chapter 7
  {
    id: "chapter7",
    key: 140,
    quest: 0x105001,
    entrySection: 72948621,
    laterSections: [632930541],
    town: 0xd00,
    townCheckpoint: 528045455,
    cleared: [0x104000, 0x104f01, 0x104003, 0x104001, 0x104002, 0x105f00],
    chapterKeys: [120, 121, 122, 123],
    chapterGroups: [6],
    islands: [hashId("ISLAND_4ST"), hashId("ISLAND_5ST")],
  },
  // Start of Chapter 8
  {
    id: "chapter8",
    key: 160,
    quest: 0x106000,
    entrySection: 488331365,
    laterSections: [1345678894],
    town: 0xd01,
    townCheckpoint: 528045455,
    cleared: [0x105001, 0x105f01, 0x105002, 0x106f00],
    chapterKeys: [140, 141, 142, 143],
    chapterGroups: [7],
    islands: [hashId("ISLAND_6ST")],
  },
  // Start of Chapter 9
  {
    id: "chapter9",
    key: 180,
    quest: 0x107000,
    entrySection: 111915467,
    laterSections: [1030594382],
    town: 0xd02,
    townCheckpoint: 528045455,
    cleared: [0x106000, 0x106001, 0x106002],
    chapterKeys: [160, 161, 162, 163, 164],
    chapterGroups: [8],
    islands: [],
  },
  // Start of the Final Chapter
  {
    id: "finalChapter",
    key: 200,
    quest: 0x108f00,
    entrySection: 1349186703,
    laterSections: [1723518046],
    town: 0xd02,
    townCheckpoint: 528045455,
    cleared: [0x107000, 0x107f00, 0x107002, 0x107001, 0x107003],
    chapterKeys: [180, 181, 182, 183, 184, 185],
    chapterGroups: [9],
    islands: [hashId("ISLAND_7ST")],
  },
  // Start of Chapter Ø
  {
    id: "chapterZero",
    key: 220,
    quest: 0x109002,
    entrySection: 274192714,
    laterSections: [694722356],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [0x108f00, 0x108000, 0x108002, 0x108001, 0x109001, 0x109000],
    chapterKeys: [200],
    chapterGroups: [10],
    islands: [hashId("ISLAND_8ST")],
  },
  // End of Chapter Ø
  {
    id: "chapterZeroEnd",
    key: CHAPTER_ZERO_END_KEY,
    quest: 0x10a031,
    entrySection: 1589922075,
    laterSections: [1845682248],
    town: 0xc00,
    townCheckpoint: 939223336,
    cleared: [
      0x109002, 0x10a000, 0x10af00, 0x10a001, 0x10a002, 0x10a010, 0x10af02,
      0x10a025,
    ],
    chapterKeys: [220, 221],
    chapterGroups: [],
    islands: [],
    questDifficulty: difficultyDigit("maniac"),
  },
  // The Maniac quests other quests open on, then `00407101`, the first Proud quest.
  {
    id: "promoteToProud",
    questDifficulty: difficultyDigit("proud"),
    counterQuests: [
      0x406325, 0x406330, 0x406331, 0x406332, 0x406333, 0x406334, 0x406335,
      0x406337, 0x406338, 0x406355, 0x406356, 0x406357, 0x406358, 0x406359,
      0x406360, 0x406364, 0x406365, 0x406366, 0x407101,
    ],
    listedQuests: { prefix: 0x406, except: [0x406367] },
  },
  // `00220101` to `00730021`.
  {
    id: "dlcStart",
    shortStories: [
      0x725000, 0x730053, 0x730100, 0x730060, 0x730055, 0x730061, 0x730065,
      0x730030, 0x730014, 0x730011, 0x730010, 0x730040, 0x730021,
    ],
    shortStorySections: [
      [0x730090, 1786949660],
      [0x730020, 1174902544],
      [0x730012, 1171285270],
    ],
    sideQuests: [0x220101, 0x220102],
    sideQuestSections: [
      [0x240121, 1133973849],
      [0x220111, 1297300194],
    ],
    confluxCycles: 3,
  },
  // The Proud quests that open others, and the cutscenes `00407320` opens on.
  {
    id: "unlockProudQuests",
    shortStories: [0x710000, 0x710001],
    counterQuests: [
      0x407301, 0x407302, 0x407303, 0x407304, 0x407310, 0x407311, 0x407312,
      0x407313, 0x407314, 0x407315, 0x407316, 0x407317, 0x407318, 0x407319,
      0x407320,
    ],
    listedQuests: { prefix: 0x407 },
  },
  // What leads to `00730201`.
  {
    id: "advanceToEpilogue",
    key: EPILOGUE_KEY,
    // The short stories `00407318` opens.
    shortStories: [0x725110, 0x730420, 0x730046],
    shortStorySections: [[0x730430, 1825705739]],
    // `00730201`'s start section: `phaseNo` Folca, `subPhaseHash`.
    location: { town: 0xc00, townCheckpoint: 939223336, spot: "START" },
  },
];
