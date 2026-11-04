# Chapter 9

The patch that takes a save at the start of Chapter 9 through the chapter to the start of Chapter 10. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 10

Chapter key 200, quest `00108F00`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_100` and the first quest of the key. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index              | Chapter 9 start | Patched                        |
| ---- | ------------------------------ | ------------------ | --------------- | ------------------------------ |
| 2506 | `CURRENT_CHAPTER`              | 0                  | 180             | 200                            |
| 2511 | `STORY_QUEST_CLEARED`          | 17, 18, 19, 20, 21 | 0               | 1                              |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 17, 18, 19, 20, 21 | 0               | 1                              |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 17, 18, 19, 20, 21 | 0               | 1                              |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 2600               | 0               | 1349186703                     |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 2600               | 0               | 1349186703                     |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 4200               | 111915467       | 0                              |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 4200               | 111915467       | 0                              |
| 2590 | `CHAPTER_KEYS`                 | List, adds         |                 | `180, 181, 182, 183, 184, 185` |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds         |                 | System 817, 6 times            |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds         |                 | `0, 0, 0, 0, 0, 0`             |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds         |                 | `0, 0, 0, 0, 0, 0`             |
| 2595 | `CHAPTER_GROUPS`               | List, adds         |                 | `9`                            |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds         |                 | `0`                            |
| 5801 | `TROPHY_EARNED`                | 9, 1413            | False           | True                           |
| 5815 | `TROPHY_PROGRESS`              | 2                  | 30              | 36                             |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018          | 8               | 9                              |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. Index 501 counts earned trophies outside Keys 1395-1453, here trophies 1 to 9. Index 1018 counts earned trophies inside that range, here trophies 1405 to 1413. The Patched column is for a save with no other trophies: the patch adds 1 to 501 or 1018 per trophy it newly earns, and index 2 only rises.

`CURRENT_TOWN` (2502) and `CURRENT_TOWN_CHECKPOINT` (2503) are written with the values they already hold, 3330 and 528045455.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name                   | Description                          |
| ---- | ---------------------- | ------------------------------------ |
| 9    | Guardian of Seedhollow | Complete Chapter 9: Opposing Wills   |
| 1413 | Opposing Wills         | Complete Chapter 9 of the main story |

Island rows, by entity:

| Unit | Name              | Entity | Row          | Chapter 9 start | Patched |
| ---- | ----------------- | ------ | ------------ | --------------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 8      | `ISLAND_7ST` | False           | True    |

Quest records cleared by indexes 17-21:

| Index | Quest      |
| ----- | ---------- |
| 17    | `00107F00` |
| 18    | `00107003` |
| 19    | `00107002` |
| 20    | `00107001` |
| 21    | `00107000` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of these quests in a traced clear. One write clears `00107F00` and `00107002`, and one clears `00107001` and `00107003`.
- 2513 and 2514 at 2600 take the value the last write gave them, a `BeginSection` guid in `quest_108f00_0_fsm_ingame`.
- 2502 and 2503 did not move through the traced chapter.
- 5801 at 9 and 1413 are the Chapter 9 trophies. Trophy 9 counts in 501 and 1413 in 1018. The traced clear earned them at the first checkpoint of `00108F00`.
- 5815 at 2 went 30 to 31 in `00107000`, 31 to 32 in `00107F00` and 32 to 36 in `00107001`, and holds 36 at the start of `00108F00`.
- 6102 at 8 turns true in the traced clear, before `00107F00` clears.

### Not patched

- Id's own entry at 10023: 1303-1310, 1305, 1404, the 1602 mastery fill and 3904, written at the change from key 181 to 182, and trophy 318 "Reach level 30 with Id" with 5802 at 16.
- `ITEM_70_0010` Rolan's Notes, `ITEM_70_0003` Sky Map Piece, and other items and quest rewards.
- The `NP0000`, `PL1900` and `NP0300` stand-ins at 10015 and 10033.
- Trophies 376 "Obtain a rare sigil" and 379 "Obtain 10 sigils".
- 2905, 2906, 4103, 4318, 4003, 7601, 7902, 8907.
- Character level, weapons, abilities, party, and the journal rows the chapter sets: 8002, 8102, 8202, 8302, 8402, 8502.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504 and 2605.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 2600 then move to 1723518046.
