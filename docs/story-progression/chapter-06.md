# Chapter 6

The patch that takes a save at the start of Chapter 6 through the chapter to the start of Chapter 7. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 7

Chapter key 140, quest `00105001`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_070`. `00105F00`, the first quest of key 140, has no chapter title and is cleared by this patch. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index                  | Chapter 6 start | Patched              |
| ---- | ------------------------------ | ---------------------- | --------------- | -------------------- |
| 2503 | `CURRENT_TOWN_CHECKPOINT`      | 0                      | 821073149       | 528045455            |
| 2506 | `CURRENT_CHAPTER`              | 0                      | 120             | 140                  |
| 2511 | `STORY_QUEST_CLEARED`          | 27, 30, 32, 33, 34, 35 | 0               | 1                    |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 27, 30, 32, 33, 34, 35 | 0               | 1                    |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 27, 30, 32, 33, 34, 35 | 0               | 1                    |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 5800                   | 0               | 72948621             |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 5800                   | 0               | 72948621             |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 7000                   | 1222948280      | 0                    |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 7000                   | 1222948280      | 0                    |
| 2590 | `CHAPTER_KEYS`                 | List, adds             |                 | `120, 121, 122, 123` |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds             |                 | System 817, 4 times  |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds             |                 | `0, 0, 0, 0`         |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds             |                 | `0, 0, 0, 0`         |
| 2595 | `CHAPTER_GROUPS`               | List, adds             |                 | `6`                  |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds             |                 | `0`                  |
| 5801 | `TROPHY_EARNED`                | 6, 1410                | False           | True                 |
| 5815 | `TROPHY_PROGRESS`              | 2                      | 18              | 22                   |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018              | 5               | 6                    |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. It holds 22 with key 140 counted before it joins 2590. Index 501 counts earned trophies outside Keys 1395-1453, here trophies 1 to 6. Index 1018 counts earned trophies inside that range, here trophies 1405 to 1410. The Patched column is for a save with no other trophies: the patch adds 1 to 501 or 1018 per trophy it newly earns, and index 2 only rises.

`CURRENT_TOWN` (2502) is written with the value it already holds, 3328.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name                         | Description                           |
| ---- | ---------------------------- | ------------------------------------- |
| 6    | Saboteur of the Divine Tower | Complete Chapter 6: In Search of Hope |
| 1410 | In Search of Hope            | Complete Chapter 6 of the main story  |

Island rows, by entity:

| Unit | Name              | Entity | Row          | Chapter 6 start | Patched |
| ---- | ----------------- | ------ | ------------ | --------------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 5      | `ISLAND_4ST` | False           | True    |
| 6102 | `ISLAND_UNLOCKED` | 6      | `ISLAND_5ST` | False           | True    |

Quest records cleared by indexes 27, 30, 32, 33, 34 and 35:

| Index | Quest      |
| ----- | ---------- |
| 27    | `00105F00` |
| 30    | `00104F01` |
| 32    | `00104003` |
| 33    | `00104002` |
| 34    | `00104001` |
| 35    | `00104000` |

### Sources

- 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of these quests in a traced clear.
- 2513 and 2514 at 5800 take the value the record write of `00105F00` gave them, a `BeginSection` guid in `quest_105001_0_fsm_ingame`.
- 2503 takes the value it reached at the first checkpoint of `00104000` and held to the start of `00105001`.
- 5801 at 6 and 1410 are the Chapter 6 trophies. Trophy 6 counts in 501 and 1410 in 1018. The traced clear earned them at the first checkpoint of `00105001`.
- 5815 at 2 went 18 to 20 in `00104001`, 20 to 21 in `00104002` and 21 to 22 just before the clear of `00105F00`, and holds 22 at the start of `00105001`.
- 6102 at 5 and 6 turn true in the traced clear, one between the clears of `00104000` and `00104F01`, the other one poll before the clear of `00105F00`.

### Not patched

- 2508, which the traced clear took from 0 to 1 at the first checkpoint of `00104000`.
- 2517-2520, the restart point. They return to their empty values at the clear of `00104001`, 2518 keeping its hash.
- Trophies 124 "Perform a link attack for the first time" and 132 "Break a foe for the first time".
- `ITEM_23_0000` Crewmate Card, `ITEM_70_0008`, and other items and quest rewards.
- The objective slots of 2513 and 2514, which the clears zero.
- 2552, 2581, 2582, 2905, 2906, 7601, 4003, 4202.
- Character level, weapons, abilities, party, the `PL1900` stand-in at 10015, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504 and 2605.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 5800 then move to 632930541. The game fills the `PL1900` stand-in at 10015 itself, 6 s after the load.
