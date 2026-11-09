# Final Chapter

The patch that takes a save at the start of the Final Chapter through the chapter, the end of the story, to the start of Chapter Ø. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter Ø

Chapter key 220 "New Mr. Fix It", quest `00109002`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_110`. `00109001`, the first quest of key 220, and `00109000` have no chapter title and are cleared by this patch. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index                  | Final Chapter start | Patched            |
| ---- | ------------------------------ | ---------------------- | ------------------- | ------------------ |
| 2502 | `CURRENT_TOWN`                 | 0                      | 3330                | 3072               |
| 2503 | `CURRENT_TOWN_CHECKPOINT`      | 0                      | 528045455           | 939223336          |
| 2506 | `CURRENT_CHAPTER`              | 0                      | 200                 | 220                |
| 2511 | `STORY_QUEST_CLEARED`          | 11, 12, 13, 14, 15, 16 | 0                   | 1                  |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 11, 12, 13, 14, 15, 16 | 0                   | 1                  |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 11, 12, 13, 14, 15, 16 | 0                   | 1                  |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 2000                   | 0                   | 274192714          |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 2000                   | 0                   | 274192714          |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 2600                   | 1349186703          | 0                  |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 2600                   | 1349186703          | 0                  |
| 2590 | `CHAPTER_KEYS`                 | List, adds             |                     | `200`              |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds             |                     | System 817, 1 time |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds             |                     | `0`                |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds             |                     | `0`                |
| 2595 | `CHAPTER_GROUPS`               | List, adds             |                     | `10`               |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds             |                     | `0`                |

Island rows, by entity:

| Unit | Name              | Entity | Row          | Final Chapter start | Patched |
| ---- | ----------------- | ------ | ------------ | ------------------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 9      | `ISLAND_8ST` | False               | True    |

Quest records cleared by indexes 11-16:

| Index | Quest      |
| ----- | ---------- |
| 11    | `00109001` |
| 12    | `00109000` |
| 13    | `00108F00` |
| 14    | `00108002` |
| 15    | `00108001` |
| 16    | `00108000` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of these quests in a traced clear. The quests clear in the order `00108F00`, `00108000`, `00108002`, `00108001`, `00109001`, `00109000`, each in its own write. Key 200 joins 2590, group 10 joins 2595 and 2506 takes 220 at the clear of `00108001`.
- 2513 and 2514 at 2000 take the value the clear of `00109000` gave them, a `BeginSection` guid in `quest_109002_0_fsm_ingame`, which also holds the `DispChapter` of `TELOP_CHAPTER_MAIN_110`. `chapter_select` names `00109001` for key 220.
- 2502 and 2503 move at the clear of `00108001` and hold through `00109000`.
- 6102 at 9 turns true in the traced clear, before `00108F00` clears.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- The party: 2201, 2202, 2203 and 2401. `00109001` moves slot 0 at 103000 from `PL0000` to `PL1900`, and 2202 is false again as `00109000` clears.
- Id's own entry at 10023, set by `IdoEntry` in `00109001`, see [`characters.md`](../characters.md), with MSP at 1112, 5802 and 5803 at 16, and 5815 at 149, 184, 185, 219, 377, 378, 380, 998.
- Trophies 1447 "Get an appraisal from Zathba", 116, 120, 128, 322, 365, 430 and 431, and 5821 at 3, 19, 53. Trophy 22 "Unlock Hard quests" arrives after the start of `00109002`.
- `ITEM_10_0002`, `ITEM_14_0011` and other items and quest rewards, with MSP at 1112.
- The `NP0000` and `PL1900` stand-ins at 10015 and 10033.
- 2552 at 4288 and 6976, 2903, 2904, 2907, 4003, 4103, 4202, 7302, 7303, 7305, 7601, 8907.
- The journal rows the chapter sets: 8002, 8102, 8202, 8302, 8402, 8502.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504 and 2605.

### Status

The patch, applied to a new save through every checkpoint, loads in game. `00109002` opens with an event, then the chapter title, so a load plays the event first: 274192714 holds the event and the title, and the next saved section, 694722356, comes after the title. Without [`fillSkippedStory`](fill.md) the objective reads 1/8, without note 08 from `00107F00`, and Id stays out of the crew.
