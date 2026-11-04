# Chapter 5

The patch that takes a save at the start of Chapter 5 through the chapter to the start of Chapter 6. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 6

Chapter key 120 "Zathba Knows All", quest `00104000`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_060`. `00104F00`, the first quest of key 120, has no chapter title and is cleared by this patch. Units are at entity 0.

### Patched

| Unit | Name                           | Index      | Chapter 5 start | Patched                   |
| ---- | ------------------------------ | ---------- | --------------- | ------------------------- |
| 2502 | `CURRENT_TOWN`                 | 0          | 3072            | 3328 (`0xD00`)            |
| 2503 | `CURRENT_TOWN_CHECKPOINT`      | 0          | 939223336       | 821073149                 |
| 2506 | `CURRENT_CHAPTER`              | 0          | 100             | 120                       |
| 2511 | `STORY_QUEST_CLEARED`          | 31, 37     | 0               | 1                         |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 31, 37     | 0               | 1                         |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 31, 37     | 0               | 1                         |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 7000       | 0               | 1222948280                |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 7000       | 0               | 1222948280                |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 7400       | 528160042       | 0                         |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 7400       | 528160042       | 0                         |
| 2590 | `CHAPTER_KEYS`                 | List, adds |                 | `100, 101, 102, 103, 104` |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds |                 | System 817, 5 times       |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds |                 | `0, 0, 0, 0, 0`           |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds |                 | `0, 0, 0, 0, 0`           |
| 2595 | `CHAPTER_GROUPS`               | List, adds |                 | `5`                       |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds |                 | `0`                       |

Quest records cleared by indexes 31 and 37:

| Index | Quest      |
| ----- | ---------- |
| 31    | `00104F00` |
| 37    | `00103001` |

### Sources

- 2502, 2503, 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of `00103001` and `00104F00` in a traced clear.
- 2513 and 2514 at 7000 take the value the record write of `00104F00` gave them, a `BeginSection` guid in `quest_104000_0_fsm_ingame`.
- 2502 and 2503 take the values written with the clear of `00104F00`.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- Trophy 21 "Unlock Normal quests", which the traced clear earned with trophy 5.
- Trophy 375 "Obtain an uncommon sigil", and 2708 and 5815 at 74, 192, for items and foes.
- 5821, 7103, 7352, 4202, 2905, 2906, the 2552 and 2582 hashes.
- Character level, weapons, abilities, party, items, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504, 2605 and the 7601 seeds.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 7000 then move to 393694498 and 1566475565. The game earns trophy 21 itself at the second move.
