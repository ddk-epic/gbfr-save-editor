# Chapter 7

The patch that takes a save at the start of Chapter 7 through the chapter to the start of Chapter 8. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md). Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Start of Chapter 8

Chapter key 160, quest `00106000`, the quest holding the chapter title `TELOP_CHAPTER_MAIN_080`. `00106F00`, the first quest of key 160, has no chapter title and is cleared by this patch. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index          | Chapter 7 start | Patched              |
| ---- | ------------------------------ | -------------- | --------------- | -------------------- |
| 2502 | `CURRENT_TOWN`                 | 0              | 3328            | 3329 (`0xD01`)       |
| 2506 | `CURRENT_CHAPTER`              | 0              | 140             | 160                  |
| 2511 | `STORY_QUEST_CLEARED`          | 22, 26, 28, 29 | 0               | 1                    |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 22, 26, 28, 29 | 0               | 1                    |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 22, 26, 28, 29 | 0               | 1                    |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 5000           | 0               | 488331365            |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 5000           | 0               | 488331365            |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 5800           | 72948621        | 0                    |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 5800           | 72948621        | 0                    |
| 2590 | `CHAPTER_KEYS`                 | List, adds     |                 | `140, 141, 142, 143` |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds     |                 | System 817, 4 times  |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds     |                 | `0, 0, 0, 0`         |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds     |                 | `0, 0, 0, 0`         |
| 2595 | `CHAPTER_GROUPS`               | List, adds     |                 | `7`                  |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List, adds     |                 | `0`                  |
| 5801 | `TROPHY_EARNED`                | 7, 1411        | False           | True                 |
| 5815 | `TROPHY_PROGRESS`              | 2              | 22              | 26                   |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018      | 6               | 7                    |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. It holds 26 with key 160 counted before it joins 2590. Index 501 counts earned trophies outside Keys 1395-1453, here trophies 1 to 7. Index 1018 counts earned trophies inside that range, here trophies 1405 to 1411. The Patched column is for a save with no other trophies: the patch adds 1 to 501 or 1018 per trophy it newly earns, and index 2 only rises.

`CURRENT_TOWN_CHECKPOINT` (2503) is written with the value it already holds, 528045455.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name                             | Description                          |
| ---- | -------------------------------- | ------------------------------------ |
| 7    | Extinguisher of the Divine Flame | Complete Chapter 7: Warning Signs    |
| 1411 | Warning Signs                    | Complete Chapter 7 of the main story |

Island rows, by entity:

| Unit | Name              | Entity | Row          | Chapter 7 start | Patched |
| ---- | ----------------- | ------ | ------------ | --------------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 7      | `ISLAND_6ST` | False           | True    |

Quest records cleared by indexes 22, 26, 28 and 29:

| Index | Quest      |
| ----- | ---------- |
| 22    | `00106F00` |
| 26    | `00105F01` |
| 28    | `00105002` |
| 29    | `00105001` |

### Sources

- 2502, 2506, 2511, 2512, 2522, 2513, 2514, 2590-2592, 2594-2596 come from the record writes of these quests in a traced clear.
- 2513 and 2514 at 5000 take the value the record write of `00106F00` gave them, a `BeginSection` guid in `quest_106000_0_fsm_ingame`.
- 2503 did not move through the traced chapter.
- 5801 at 7 and 1411 are the Chapter 7 trophies. Trophy 7 counts in 501 and 1411 in 1018. The traced clear earned them at the first checkpoint of `00106000`.
- 5815 at 2 went 22 to 24 in `00105001`, 24 to 25 just before the clear of `00105F01` and 25 to 26 just before the clear of `00106F00`, and holds 26 at the start of `00106000`.
- 6102 at 7 turns true in the traced clear, one poll before the clear of `00106F00`.

### Not patched

- Story items `ITEM_70_0008` Dehg's Catalyst Stone, taken at a checkpoint of `00105001`, and `ITEM_70_0006` Elpis, the Mind Sealer, given at its clear.
- Other items and quest rewards.
- The `NP0300` stand-in at 10015 and its weapon `WEP_NP0300_01`.
- Trophies and archive rows outside the chapter: 7902, 5815 at 46, 47.
- 7601, 4003.
- Character level, weapons, abilities, party, and the journal rows the chapter sets: 8102, 8202, 8402, 8502.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- 2504 and 2605.

### Status

The patch, applied to a new save through every checkpoint, loads in game at the chapter title. 2513 and 2514 at 5000 then move to 1345678894.
