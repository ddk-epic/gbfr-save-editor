import { hashId } from "@gbfr/core";

/** What one chapter start adds to the checkpoint before it. */
export interface StoryCheckpoint {
  /** `chapter_select.Key`. */
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

/** `chapter_select.Key`. */
export const STORY_END_KEY = 222;

/** In story order. */
export const STORY_CHECKPOINTS: readonly StoryCheckpoint[] = [
  // Start of Chapter 2
  {
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
  // Start of Chapter 10
  {
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
  // End of the story
  {
    key: STORY_END_KEY,
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
  },
];
