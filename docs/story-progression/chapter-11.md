# Chapter Ø

The patch that takes a save at the start of Chapter Ø to the end of the chapter. It lists every value written. The method for writing the chapter lists is in [`chapter-01.md`](chapter-01.md).

## End of Chapter Ø

Chapter key 222, quest `0010A031`, the quest underway after the last story cutscene. All of Rolan's notes are held, with the journal quests behind them cleared.

### Patched

| Unit | Name                           | Index                   | Chapter Ø start | Patched             |
| ---- | ------------------------------ | ----------------------- | --------------- | ------------------- |
| 2506 | `CURRENT_CHAPTER`              | 0                       | 220             | 222                 |
| 2511 | `STORY_QUEST_CLEARED`          | 0, 2, 5, 6, 7, 8, 9, 10 | 0               | 1                   |
| 2512 | `STORY_QUEST_LIVE_CLEARED`     | 0, 2, 5, 6, 7, 8, 9, 10 | 0               | 1                   |
| 2522 | `STORY_QUEST_THIRD_CLEARED`    | 0, 2, 5, 6, 7, 8, 9, 10 | 0               | 1                   |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 600                     | 0               | 1589922075          |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 600                     | 0               | 1589922075          |
| 2513 | `STORY_QUEST_CHECKPOINTS`      | 2000                    | 274192714       | 0                   |
| 2514 | `STORY_QUEST_CHECKPOINTS_LIVE` | 2000                    | 274192714       | 0                   |
| 2590 | `CHAPTER_KEYS`                 | List, adds              |                 | `220`, `221`        |
| 2591 | `CHAPTER_BEST_DIFFICULTY`      | List, adds              |                 | System 817, 2 times |
| 2592 | `CHAPTER_ULTIMATE_CLEARED`     | List, adds              |                 | `0`, `0`            |
| 2594 | `CHAPTER_ULTIMATE_CLEARS`      | List, adds              |                 | `0`, `0`            |

Quest records cleared:

| Index | Quest      |
| ----- | ---------- |
| 0     | `0010AF02` |
| 2     | `0010AF00` |
| 5     | `0010A025` |
| 6     | `0010A010` |
| 7     | `0010A002` |
| 8     | `0010A001` |
| 9     | `0010A000` |
| 10    | `00109002` |

### Sources

- All values come from the record writes of these quests in a traced clear. 2595 and 2596 do not move before the clear of `0010A031`.
- 2513 and 2514 at 600 take the first `BeginSection` guid of `0010A031`, and the game moves them to 1845682248 after a load.
- 2502 and 2503 stay at the Chapter Ø start values. In a traced clear they do not move from `00109001` through `0010A031`.
- 2509 is not patched. The game fills it after a load, with the value the traced run holds in `0010A031`.

### Not patched

- The notes, story cutscenes, counter quests, trophies and rewards, see [`fill.md`](fill.md).
- 2501, which reads 0 at the start of `0010A031` in the traced run and on a new save.
- 2517 and 2519, which return to their start values as `0010AF02` clears. 2518 keeps 515372814 in the traced run and 0 here.
- The party writes of `0010AF02`, which end before it clears.
- Key 222 in 2590, group 11 in 2595 and 2596, and 2501 to 1. The game writes them as it clears `0010A031` after a load, with no quest played. A traced clear writes them at the first Maniac clear, and `promoteToProud` writes them, see [`quests.md`](../quests.md).
- The 2575 rows of the uncleared quests.

### Status

The patch, applied to a new save with `clearHints` and `fillSkippedStory`, loads in game. `0010A031` moves to its second section and clears 18 s later, the game clears `00725100`, `00730000` and `00730001`, and the objective moves to "Progress through Maniac quests".
