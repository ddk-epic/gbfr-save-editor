import { hashId } from "../../core/xxhash32-custom";

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
  trophies: readonly number[];
  /** `TROPHY_PROGRESS` index and the value it holds at this checkpoint. */
  trophyProgress: readonly (readonly [number, bigint])[];
  /** `ISLAND_KEY` hashes. */
  islands: readonly number[];
}

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
    trophies: [1, 1405],
    trophyProgress: [
      [2, 4n],
      [501, 1n],
      [1018, 1n],
    ],
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
    trophies: [2, 1406],
    trophyProgress: [
      [2, 6n],
      [501, 2n],
      [1018, 2n],
    ],
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
    trophies: [3, 1407],
    trophyProgress: [
      [2, 9n],
      [501, 3n],
      [1018, 3n],
    ],
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
    trophies: [4, 1408],
    trophyProgress: [
      [2, 13n],
      [501, 4n],
      [1018, 4n],
    ],
    islands: [hashId("ISLAND_2ST"), hashId("ISLAND_3ST")],
  },
];
