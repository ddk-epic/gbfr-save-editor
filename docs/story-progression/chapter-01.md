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

| Unit | Name                           | Index | New save  | Patched             |
| ---- | ------------------------------ | ----- | --------- | ------------------- |
| 2502 | `CURRENT_TOWN`                 | 0     | 3872      | 3072 (`0xC00`)      |
| 2503 | `CURRENT_TOWN_CHECKPOINT`      | 0     | 528045455 | 939223336           |
| 2506 | `CURRENT_CHAPTER`              | 0     | -1        | 40                  |
| 2511 | `STORY_QUEST_CLEARED`          | 47-53 | 0         | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 47-53 | 0         | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 47-53 | 0         | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 8200  | 0         | 1299620138          |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 8200  | 0         | 1299620138          |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 10200 | 792562208 | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 10200 | 792562208 | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List  | Empty     | `0, 1, 20, 21, 22`  |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List  | Empty     | System 817, 5 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List  | Empty     | `0, 0, 0, 0, 0`     |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List  | Empty     | `0, 0, 0, 0, 0`     |
| 2595 | `CHAPTER_GROUPS`               | List  | Empty     | `0, 1`              |
| 2596 | `CHAPTER_GROUP_FLAGS`          | List  | Empty     | `0, 0`              |

Island rows, by entity:

| Unit | Name              | Entity | Row          | New save | Patched |
| ---- | ----------------- | ------ | ------------ | -------- | ------- |
| 6102 | `ISLAND_UNLOCKED` | 2      | `ISLAND_1ST` | False    | True    |

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
- 6102 at 2 turns true in the traced clear, and the game does not set it on a patched save.

### Set by the game

A load without the 5801 and 5815 patches set them itself, in the poll where 2513 and 2514 at 8200 reach the quest's second section, 18 s after the load. The same poll moves 2591 on key 22 to 2, on a save played on Hard, which fits the game recording that chapter's clear at the current difficulty. It also sets four 2552 entries, 7808, 7872, 7936 and 8000. Also after the load, 7101 fills on 63 rows, and 1113, 4331 and 8901 move.

### Not patched

- Story trophies and their counters, items and archives, see [`fill.md`](fill.md).
- `CURRENT_CHAPTER` (2506) at 1, the online entry, stays -1.
- 2501, unnamed, stays 0. `QUEST_SEED` (2504) and the 7601 seeds stay as they are.
- Hints, a separate edit, see [`tutorials.md`](../tutorials.md).
- Character level, weapons, abilities, party, items, and the journal and archive rows a played prologue sets.
- Trophy 194 "Room for Improvement", "Unlock the captain's first Mastery node", and its counters, earned by spending MSP in the traced clear.

### Status

The patch loads in game into the fade-in, with 2591 taking system unit 817, the story difficulty, which reads 2 on a save on Hard. In a load with 2591 at a fixed 1, 5801 and 5815 hold their patched values through the checkpoint with no further move, so the trophies are not counted twice, and 2513 and 2514 at 8200, 2552 and 2591 move as in a load without them.

Open: whether 5815 at 2 rises from 4 as later chapter keys clear.
