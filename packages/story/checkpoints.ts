import { hashId } from "@gbfr/core";
import { difficultyDigit } from "@gbfr/quest";
import type { GivenSummon } from "@gbfr/summon";

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

/** A step after Chapter Ø. */
export interface ProgressCheckpoint extends CheckpointBase {
  /** `chapter_select.Key` the game moves to after the step. */
  key?: number;
  /** Counter quests cleared. */
  counterQuests?: readonly number[];
  /** Counter quests opened with no clear. */
  openedQuests?: readonly number[];
  /** Counter quests listed: every id under `prefix` apart from `except`. */
  listedQuests?: { prefix: number; except?: readonly number[] };
  storyCutscenes?: readonly number[];
  /** Section hashes the game leaves on story cutscenes not yet begun, 0 to clear one. */
  storyCutsceneSections?: readonly (readonly [quest: number, hash: number])[];
  /** Side quests completed. */
  sideQuests?: readonly number[];
  /** Section hashes the game leaves on side quests not yet begun. */
  sideQuestSections?: readonly (readonly [quest: number, hash: number])[];
  /** Story quests cleared after Chapter Ø. */
  storyQuests?: readonly number[];
  /** Story quest left underway at a `BeginSection` guid, 2501 to 0. */
  begunQuest?: { quest: number; section: number };
  /** Summons the skipped story quests give. */
  summons?: readonly GivenSummon[];
  /** `chapter_select.Key` values added to 2590. */
  chapterKeys?: readonly number[];
  /** Groups added to 2595, with their 2596 value. */
  chapterGroups?: readonly (readonly [group: number, flag: number])[];
  /** 2506 after the step. */
  chapter?: number;
  difficultyStage?: number;
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
    storyQuests: [0x10a031],
    chapterKeys: [CHAPTER_ZERO_END_KEY],
    chapterGroups: [[11, 1]],
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
    storyCutscenes: [
      0x725000, 0x730053, 0x730100, 0x730060, 0x730055, 0x730061, 0x730065,
      0x730030, 0x730014, 0x730011, 0x730010, 0x730040, 0x730021,
    ],
    storyCutsceneSections: [
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
  // Minimum Proud quest clears that open others.
  {
    id: "unlockProudQuests",
    storyCutscenes: [0x710000, 0x710001],
    counterQuests: [
      0x407301, 0x407302, 0x407303, 0x407304, 0x407310, 0x407311, 0x407312,
      0x407313, 0x407314, 0x407315, 0x407316, 0x407317, 0x407318, 0x407319,
      0x407320,
    ],
    listedQuests: { prefix: 0x407 },
  },
  // Leads to `00730201`.
  {
    id: "advanceToEpilogue",
    key: EPILOGUE_KEY,
    storyCutscenes: [0x725110, 0x730420, 0x730046],
    storyCutsceneSections: [[0x730430, 1825705739]],
    location: { town: 0xc00, townCheckpoint: 939223336, spot: "START" },
  },
  // `00408301`, `0010B000` and `0010B001`, leaving `0010B002` at its start.
  {
    id: "unlockChaos",
    questDifficulty: difficultyDigit("chaos"),
    counterQuests: [0x408301],
    storyCutscenes: [0x730201, 0x730005, 0x730102, 0x730103],
    storyCutsceneSections: [
      [0x730090, 0],
      [0x730020, 0],
      [0x730006, 739676793],
    ],
    storyQuests: [0x10b000, 0x10b001],
    begunQuest: { quest: 0x10b002, section: 1597052236 },
    summons: [
      {
        key: "su_So4900_TU",
        trait: "SKILL_013_00",
        bonus: 0x00d171e0,
        levels: [4, 1],
        equip: true,
      },
    ],
    chapterKeys: [240],
    chapter: 241,
    difficultyStage: 7,
    location: { town: 0xc00, townCheckpoint: 939223336, spot: "START" },
  },
  // The Chaos quests, Conflux Cycle 4 and `0010C001`, up to the record of `00409302`.
  {
    id: "unlockChaosPlus",
    questDifficulty: difficultyDigit("chaos+"),
    counterQuests: [
      0x408311, 0x408312, 0x408302, 0x408305, 0x408314, 0x408308, 0x408306,
      0x408313, 0x408315, 0x409302,
    ],
    storyCutscenes: [
      0x730103, 0x730410, 0x730400, 0x730207, 0x730048, 0x730031, 0x730022,
      0x730331, 0x730332, 0x730101, 0x730312, 0x730200, 0x730333, 0x730202,
    ],
    storyCutsceneSections: [
      [0x730020, 1174902544],
      [0x730006, 739676793],
    ],
    sideQuestSections: [
      [0x230401, 498758966],
      [0x220411, 793767595],
    ],
    storyQuests: [0x10b002, 0x10c001],
    // From `0010B002` and its tutorial.
    summons: [
      {
        key: "su_So3300_TU",
        trait: "SKILL_068_00",
        bonus: 0x2270bc40,
        levels: [5, 1],
        equip: false,
      },
      {
        key: "su_So4b00_TU",
        trait: "SKILL_069_00",
        bonus: 0xf7b0316f,
        levels: [5, 1],
        equip: true,
      },
    ],
    chapterKeys: [240, 241],
    chapter: 242,
    difficultyStage: 8,
    confluxCycles: 4,
    location: { town: 0xc00, townCheckpoint: 939223336, spot: "1_START" },
  },
];
