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
| 5801 | `TROPHY_EARNED`                | 4, 1408        | False           | True                |
| 5815 | `TROPHY_PROGRESS`              | 2              | 9               | 13                  |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018      | 3               | 4                   |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. Index 501 counts earned trophies outside Keys 1395-1453, here trophies 1, 2, 3 and 4. Index 1018 counts earned trophies inside that range, here trophies 1405, 1406, 1407 and 1408.

`CURRENT_TOWN` (2502) and `CURRENT_TOWN_CHECKPOINT` (2503) are written with the values they already hold, 3072 and 939223336.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name                    | Description                            |
| ---- | ----------------------- | -------------------------------------- |
| 4    | Destroyer of the Armada | Complete Chapter 4: Skies Forever Blue |
| 1408 | Skies Forever Blue      | Complete Chapter 4 of the main story   |

Tutorial, tip and island rows, by entity:

| Unit | Name                    | Entity | Row                    | Chapter 4 start | Patched |
| ---- | ----------------------- | ------ | ---------------------- | --------------- | ------- |
| 5902 | `TUTORIAL_WINDOW_FLAGS` | 37     | `TU_CHARATICKET`       | 0               | 1       |
| 5902 | `TUTORIAL_WINDOW_FLAGS` | 40     | `TU_SHOPFUNC`          | 0               | 1       |
| 8702 | `TIP_FLAGS`             | 133    | 8701 hash `0x6F1A2D86` | 2               | 3       |
| 8702 | `TIP_FLAGS`             | 235    | `NOTE_WINDOW_TIPS_65`  | 2               | 3       |
| 8702 | `TIP_FLAGS`             | 248    | `NOTE_WINDOW_TIPS_80`  | 2               | 3       |
| 6102 | `ISLAND_UNLOCKED`       | 3      | `ISLAND_2ST`           | False           | True    |
| 6102 | `ISLAND_UNLOCKED`       | 4      | `ISLAND_3ST`           | False           | True    |

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
- 5801 at 4 and 1408 are the Chapter 4 trophies. Trophy 4 counts in 501 and 1408 in 1018.
- 5815 at 2 went 9 to 13 from the start of `00102000` to the clear of `00103F00`, and holds 13 at the start of `00103001`.
- The tutorial and tip rows are every row of 5902, 6002 and 8702 that moved in the traced chapter, up to the first checkpoint of `00103001`.
- 6102 at 3 and 4 turn true in the traced clear. On a loaded save the game set 6102 at 4 itself at the end of `00103F00` and did not set 6102 at 3.

### Not patched

- Character level, weapons, abilities, party, items, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- Trophy 76 "Casual Scribe", "Discover an archive entry for the first time", and 7902 at 35.
- 5815 at 446, the count for destroying enemy cannons in Chapter 4.
- `TU_SETTING`, `TUTORIAL_SETTING` and tips 76, 222, 295, 307 and 308, set by the game as the System menu first opens.
- 2504, 2605 and the 7601 seeds.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 7400 then move to 1958916885.
