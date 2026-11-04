# Chapter 3

The patch that takes a save at the start of Chapter 3 through the chapter to the start of Chapter 4. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 4

Chapter key 80, quest `00102000` "Nightmare". Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index      | Chapter 3 start | Patched             |
| ---- | ------------------------------ | ---------- | --------------- | ------------------- |
| 2506 | `CURRENT_CHAPTER`              | 0          | 60              | 80                  |
| 2511 | `STORY_QUEST_CLEARED`          | 42, 43, 44 | 0               | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 42, 43, 44 | 0               | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 42, 43, 44 | 0               | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8000       | 0               | 240333228           |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8000       | 0               | 240333228           |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8800       | 2130360527      | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8800       | 2130360527      | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List, adds |                 | `60, 61, 62`        |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds |                 | System 817, 3 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds |                 | `0, 0, 0`           |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds |                 | `0, 0, 0`           |
| 2595 | `CHAPTER_GROUPS`               | List, adds |                 | `3`                 |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds |                 | `0`                 |

`CURRENT_TOWN` (2502) and `CURRENT_TOWN_CHECKPOINT` (2503) are written with the values they already hold, 3072 and 939223336.

Quest records cleared by indexes 42, 43 and 44:

| Index | Quest      |
| ----- | ---------- |
| 42    | `00101005` |
| 43    | `00101004` |
| 44    | `00101003` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record write that ends the `00101003` run in a traced clear.
- 2513 and 2514 at 8000 take the value that write gave them, a `BeginSection` guid in `quest_102000_0_fsm_ingame`.
- 2502 and 2503 did not move through the traced chapter.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- Character level, weapons, abilities, party, items, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- 2201, 2202, 2203 and 2401, the story party. In the traced clear 2202 is set on all four slots and 2203 cleared in the record write, and 2201 and 2401 move 7 s later.
- Trophy 1442 "No Cap" and trophy 1443 "Knickknack Shack Regular", earned in the traced clear with the action not done on the save.
- 2552 at 7488, the second `GEEN_001_00` sigil, 2903 and 2904, 2504, 2605 and the 7601 seeds.

### Set by the game

Within 20 s of the load the game fills 2903 and 2904, sets 2202 on all four slots, clears 2203 and sets 2401, and copies the captain into 1402, 1404, 3003 and 3004 at 104000. It also moves 8202 at 119 and 8402 at 4 and 30. 27 s after the load it earns 28 trophies in Keys 1395-1453, among them 1442, and takes 5815 at 1018 from 3 to 31, with 5815 at 1175, 5820, 5821, 5822 and 7302 at 17 and 18 moving in the same poll.

### Status

The patch, applied to a save at the start of Chapter 3 that the game has saved, loads in game.
