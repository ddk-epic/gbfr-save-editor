# Chapter 2

The patch that takes a save at the start of Chapter 2 through the chapter to the start of Chapter 3. It lists every value written. The patch before it is in [`chapter-01.md`](chapter-01.md), with the method for writing the chapter lists. Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 3

Chapter key 60, quest `00101003` "The Mines of Tempeal". Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index      | Chapter 2 start | Patched             |
| ---- | ------------------------------ | ---------- | --------------- | ------------------- |
| 2506 | `CURRENT_CHAPTER`              | 0          | 40              | 60                  |
| 2511 | `STORY_QUEST_CLEARED`          | 41, 45, 46 | 0               | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 41, 45, 46 | 0               | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 41, 45, 46 | 0               | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8800       | 0               | 2130360527          |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8800       | 0               | 2130360527          |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8200       | 1299620138      | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8200       | 1299620138      | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List, adds |                 | `40, 41`            |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds |                 | System 817, 2 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds |                 | `0, 0`              |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds |                 | `0, 0`              |
| 2595 | `CHAPTER_GROUPS`               | List, adds |                 | `2`                 |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds |                 | `0`                 |

`CURRENT_TOWN` (2502) and `CURRENT_TOWN_CHECKPOINT` (2503) are written with the values they already hold, 3072 and 939223336.

Quest records cleared by indexes 41, 45 and 46:

| Index | Quest      |
| ----- | ---------- |
| 41    | `00101F00` |
| 45    | `00101002` |
| 46    | `00101001` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of `00101F00`, `00101001` and `00101002` in a traced clear.
- 2513 and 2514 at 8800 take the value the traced clear wrote as `00101003` began. It is a `BeginSection` guid in `quest_101003_0_fsm_ingame`, and 2130360527 is also the first section of `00101001`.
- 2502 and 2503 did not move through the traced chapter.

### Set by the game

After the load, 1303-1315 and 1404 at 10015 fill from the stand-in row: `NP0000` at level 8, XP 1890, base HP 305, base attack 31. 4331 moves. 31 s after the load 2513 and 2514 at 8800 move to the quest's second section, 1974310874. 5801 and 5815 do not move.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- Character level, weapons, abilities, party, items, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- Trophy 374 "Available Everywhere", "Obtain a common sigil", earned with the first sigil in the traced clear, and 5815 at 192. 1701, 2701-2704, 2708 and 8002, which hold that sigil.
- 2504, 2605 and the 7601 seeds.

### Status

The patch, applied to a save at the start of Chapter 2 that the game has saved, loads in game into the fade-in.
