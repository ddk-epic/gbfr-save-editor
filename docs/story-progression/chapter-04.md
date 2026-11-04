# Chapter 4

The patch that takes a save at the start of Chapter 4 through the chapter to the start of Chapter 5. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 5

Chapter key 100 "Mt. Neigelith", quest `00103001`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_050`. `00103F00`, the first quest of key 100, has no chapter title and is cleared by this patch. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index          | Chapter 4 start | Patched             |
| ---- | ------------------------------ | -------------- | --------------- | ------------------- |
| 2506 | `CURRENT_CHAPTER`              | 0              | 80              | 100                 |
| 2511 | `STORY_QUEST_CLEARED`          | 36, 38, 39, 40 | 0               | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 36, 38, 39, 40 | 0               | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 36, 38, 39, 40 | 0               | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 7400           | 0               | 528160042           |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 7400           | 0               | 528160042           |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8000           | 240333228       | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8000           | 240333228       | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List, adds     |                 | `80, 81, 82`        |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds     |                 | System 817, 3 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds     |                 | `0, 0, 0`           |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds     |                 | `0, 0, 0`           |
| 2595 | `CHAPTER_GROUPS`               | List, adds     |                 | `4`                 |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds     |                 | `0`                 |

`CURRENT_TOWN` (2502) and `CURRENT_TOWN_CHECKPOINT` (2503) are written with the values they already hold, 3072 and 939223336.

Island rows, by entity:

| Unit | Name              | Entity | Row          | Chapter 4 start | Patched |
| ---- | ----------------- | ------ | ------------ | --------------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 3      | `ISLAND_2ST` | False           | True    |
| 6102 | `ISLAND_UNLOCKED` | 4      | `ISLAND_3ST` | False           | True    |

Quest records cleared by indexes 36, 38, 39 and 40:

| Index | Quest      |
| ----- | ---------- |
| 36    | `00103F00` |
| 38    | `00102F00` |
| 39    | `00102002` |
| 40    | `00102000` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of `00102000`, `00102F00`, `00102002` and `00103F00` in a traced clear.
- 2513 and 2514 at 7400 take the value the record write of `00103F00` gave them, a `BeginSection` guid in `quest_103001_0_fsm_ingame`.
- 2502 and 2503 did not move through the traced chapter.
- 6102 at 3 and 4 turn true in the traced clear. On a loaded save the game set 6102 at 4 itself at the end of `00103F00` and did not set 6102 at 3.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- Character level, weapons, abilities, party, items, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- Trophy 76 "Casual Scribe", "Discover an archive entry for the first time", and 7902 at 35.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504, 2605 and the 7601 seeds.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 7400 then move to 1958916885.
