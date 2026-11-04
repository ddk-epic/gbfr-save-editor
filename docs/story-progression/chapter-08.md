# Chapter 8

The patch that takes a save at the start of Chapter 8 through the chapter to the start of Chapter 9. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 9

Chapter key 180, quest `00107000`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_090` and the first quest of the key. Units are at entity 0.

### Patched

| Unit | Name                           | Index      | Chapter 8 start | Patched                   |
| ---- | ------------------------------ | ---------- | --------------- | ------------------------- |
| 2502 | `CURRENT_TOWN`                 | 0          | 3329            | 3330 (`0xD02`)            |
| 2506 | `CURRENT_CHAPTER`              | 0          | 160             | 180                       |
| 2511 | `STORY_QUEST_CLEARED`          | 23, 24, 25 | 0               | 1                         |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 23, 24, 25 | 0               | 1                         |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 23, 24, 25 | 0               | 1                         |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 4200       | 0               | 111915467                 |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 4200       | 0               | 111915467                 |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 5000       | 488331365       | 0                         |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 5000       | 488331365       | 0                         |
| 2590 | `CHAPTER_KEYS`                 | List, adds |                 | `160, 161, 162, 163, 164` |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds |                 | System 817, 5 times       |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds |                 | `0, 0, 0, 0, 0`           |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds |                 | `0, 0, 0, 0, 0`           |
| 2595 | `CHAPTER_GROUPS`               | List, adds |                 | `8`                       |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds |                 | `0`                       |
| 5801 | `TROPHY_EARNED`                | 8, 1412    | False           | True                      |
| 5815 | `TROPHY_PROGRESS`              | 2          | 26              | 30                        |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018  | 7               | 8                         |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. Index 501 counts earned trophies outside Keys 1395-1453, here trophies 1 to 8. Index 1018 counts earned trophies inside that range, here trophies 1405 to 1412. The Patched column is for a save with no other trophies: the patch adds 1 to 501 or 1018 per trophy it newly earns, and index 2 only rises.

`CURRENT_TOWN_CHECKPOINT` (2503) is written with the value it already holds, 528045455.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name              | Description                          |
| ---- | ----------------- | ------------------------------------ |
| 8    | One with the Blue | Complete Chapter 8: Relink           |
| 1412 | Relink            | Complete Chapter 8 of the main story |

Quest records cleared by indexes 23, 24 and 25:

| Index | Quest      |
| ----- | ---------- |
| 23    | `00106002` |
| 24    | `00106001` |
| 25    | `00106000` |

### Sources

- 2502, 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of these quests in a traced clear. One write clears `00106001` and `00106002`.
- 2513 and 2514 at 4200 take the value that write gave them, a `BeginSection` guid in `quest_107000_0_fsm_ingame`.
- 2503 did not move through the traced chapter.
- 5801 at 8 and 1412 are the Chapter 8 trophies. Trophy 8 counts in 501 and 1412 in 1018. The traced clear earned them at the first checkpoint of `00107000`.
- 5815 at 2 went 26 to 29 and 29 to 30 in `00106001` and `00106002`, and holds 30 at the start of `00107000`.

### Not patched

- Crewmate Card `ITEM_23_0000`, `ITEM_02_0050`, and other items and quest rewards.
- `WEP_PL0000_99` and `WEP_PL0100_99`, the weapons the chapter's last fight adds, the `NP0300` and `NP0000` stand-ins at 10015, and the captain in play's `_03` raised to XP 1740 and uncap 3.
- Trophies outside the chapter: 88 "Defeat a slime", 136 "Destroy an enemy part", 364, 420, and their 5815 counters, 7801, 7803.
- 2516, 2517-2519, 2905, 2906, 2509, 4103, 4003, 7601.
- Character level, weapons, abilities, party, and the journal rows the chapter sets: 8102, 8202, 8302, 8402, 8502, 8002.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504 and 2605.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 4200 then move to 1030594382.
