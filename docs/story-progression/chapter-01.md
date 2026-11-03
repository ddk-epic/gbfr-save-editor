# Chapter 1

The patch that takes a new save through the prologue and Chapter 1 to the start of Chapter 2. It lists every value written, starting from a new save at the prologue's first quest. Each later chapter has its own file. Unit meanings are in [`quests.md`](../quests.md) and [`trophies.md`](../trophies.md).

## Chapter lists

A new save holds 2590, 2591, 2592, 2594, 2595 and 2596 as unit tables with no value vector, and no unit for 2593. A list therefore cannot be written in place. A patch writes as follows:

1. Each list gets a new vtable, unit table and value vector after the end of the SlotData FlatBuffer.
2. The list's entry in the root `int` table is repointed at the new unit table, keeping its position in the table.
3. The checksums and footer move to the new end of the FlatBuffer.
4. The header's SlotData size and the footer's checksum offset take the new positions, and the slot checksum is recomputed.

The game accepts the result and lays the units out again at its next save.

## Start of Chapter 2

Chapter key 40, quest `00101F00` "Please Save Tempeal". The save loads into the chapter's black screen fade-in. Units are at entity 0 unless listed by entity.

### Patched

| Unit | Name                           | Index     | New save  | Patched             |
| ---- | ------------------------------ | --------- | --------- | ------------------- |
| 2502 | `CURRENT_TOWN`                 | 0         | 3872      | 3072 (`0xC00`)      |
| 2503 | `CURRENT_TOWN_CHECKPOINT`      | 0         | 528045455 | 939223336           |
| 2506 | `CURRENT_CHAPTER`              | 0         | -1        | 40                  |
| 2511 | `STORY_QUEST_CLEARED`          | 47-53     | 0         | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 47-53     | 0         | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 47-53     | 0         | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8200      | 0         | 1299620138          |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8200      | 0         | 1299620138          |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 10200     | 792562208 | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 10200     | 792562208 | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List      | Empty     | `0, 1, 20, 21, 22`  |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List      | Empty     | System 817, 5 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List      | Empty     | `0, 0, 0, 0, 0`     |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List      | Empty     | `0, 0, 0, 0, 0`     |
| 2595 | `CHAPTER_GROUPS`               | List      | Empty     | `0, 1`              |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List      | Empty     | `0, 0`              |
| 5801 | `TROPHY_EARNED`                | 1, 1405   | False     | True                |
| 5815 | `TROPHY_PROGRESS`              | 501, 1018 | 0         | 1                   |
| 5815 | `TROPHY_PROGRESS`              | 2         | 0         | 4                   |

`TROPHY_PROGRESS` holds separate counters, not a count of trophies. Index 2 counts chapter keys cleared, for trophy 12 "Complete all chapters on Action difficulty", which needs 41 and stays unearned. Index 501 counts earned trophies outside Keys 1395-1453, here trophy 1. Index 1018 counts earned trophies inside that range, here trophy 1405.

Trophies earned by 5801, by `badge.Key`:

| Key  | Name                 | Description                              |
| ---- | -------------------- | ---------------------------------------- |
| 1    | Visitor from Beyond  | Complete Chapter 1: The Western Frontier |
| 1405 | The Western Frontier | Complete Chapter 1 of the main story     |

Tutorial and tip rows, by entity:

| Unit | Name                    | Entity | Row                   | New save | Patched |
| ---- | ----------------------- | ------ | --------------------- | -------- | ------- |
| 5902 | `TUTORIAL_WINDOW_FLAGS` | 94     | `TU_MAP`              | 0        | 1       |
| 6002 | `TUTORIAL_MENU_FLAGS`   | 88     | `TUTORIAL_MAP`        | 0        | 1       |
| 6002 | `TUTORIAL_MENU_FLAGS`   | 91     | `TUTORIAL_PAD_ASSSGN` | 0        | 1       |
| 8702 | `TIP_FLAGS`             | 229    | 8701 hash 594130054   | 2        | 3       |
| 8702 | `TIP_FLAGS`             | 230    | 8701 hash 2065024838  | 2        | 3       |

Quest records cleared by indexes 47-53:

| Index | Quest      |
| ----- | ---------- |
| 47    | `00101000` |
| 48    | `00100006` |
| 49    | `00100005` |
| 50    | `00100003` |
| 51    | `00100002` |
| 52    | `00100001` |
| 53    | `00100000` |

### Sources

- 2506, 2595, 2596, and 2511, 2512 and 2522 at index 47 come from the record write of `00101000` in a traced clear.
- 2590 is inferred where a key's move was not traced: keys 0, 1 and 22 were seen joining, and key 21 was not. A later save holds the same first five keys.
- Indexes 48-53 are inferred from the order of the prologue's quests. The clears between keys 20 and 22 were not traced.
- 2513 and 2514 at 8200 take the first `BeginSection` guid in `quest_101f00_0_fsm_ingame`. Entry 10200 is the same value for `00100002`, which a new save has begun.
- 2503 takes the value logged with 2502 at `0xC00`, not one read at this point in the story.
- 2592 and 2594 take 0 as these keys join, as in [`quests.md`](../quests.md).
- `TU_MAP` and `TUTORIAL_MAP` move together in every load of a patched save without them, and in the traced prologue. 8702 at 229 and 230 move in that poll on a patched load. `TUTORIAL_PAD_ASSSGN`, `MultiPurposeId` `FirstControllerTypeSetting`, moves up to 2 s later. It is taken as the interact and check mapping window by its timing and row, not by its text.
- 5801 and 5815 come from the traced clear, and 1 and 1405 are the two Chapter 1 trophies. Trophy 1 counts in 501 and 1405 in 1018. 5815 at 2 is the chapter key count, 3 to 4 in that clear, and a patched load left it at 0 through the checkpoint where the game set the trophies.

### Set by the game

A load without the 5801 and 5815 patches set them itself, in the poll where 2513 and 2514 at 8200 reach the quest's second section, 18 s after the load. The same poll moves 2591 on key 22 to 2, on a save played on Hard, which fits the game recording that chapter's clear at the current difficulty. It also sets four 2552 entries, 7808, 7872, 7936 and 8000. Also after the load, 7101 fills on 63 rows, and 1113, 4331 and 8901 move.

### Not patched

- `CURRENT_CHAPTER` (2506) at 1, the online entry, stays -1.
- 2501, unnamed, stays 0. `QUEST_SEED` (2504) and the 7601 seeds stay as they are.
- Character level, weapons, abilities, party, items, and the tutorial, journal and archive rows a played prologue sets.
- Trophy 194 "Room for Improvement", "Unlock the captain's first Mastery node", and its counters, earned by spending MSP in the traced clear.

### Status

The patch loads in game into the fade-in, with 2591 taking system unit 817, the story difficulty, which reads 2 on a save on Hard. Without the tutorial and tip rows the save shows the map and interact and check mapping windows; with them neither window shows. In a load with 2591 at a fixed 1, 5801 and 5815 hold their patched values through the checkpoint with no further move, so the trophies are not counted twice, and 2513 and 2514 at 8200, 2552 and 2591 move as in a load without them.

Open: whether 5815 at 2 rises from 4 as later chapter keys clear.
