# Quests

Story quests, side quests, quest counter quests and fate quests are parallel arrays at entity 0, one entry per quest.

## Quest ids

A quest id is a `quest_baseinfo_ex_data.Key`, 8 hex digits, stored as the uint the digits spell: `00401301` is 4,199,169.

| Prefix | Quests               |
| ------ | -------------------- |
| `001`  | Story quests         |
| `002`  | Side quests          |
| `0030` | Fate quests          |
| `0040` | Quest counter quests |

- A quest's title is `TXT_QR_<id without the leading 00>` in `text_stage.msg`.
- The sixth digit is the quest's family: `FUN_14061d110`, which copies the game's quest records into the save, sorts them by it. 1 is story, 2 side, 3 fate, 4 quest counter and 7 the 150 entries of 2580.

## Story quests

| Attribute | Name                           | Type          | Holds                                                 |
| --------- | ------------------------------ | ------------- | ----------------------------------------------------- |
| 2510      | `STORY_QUEST_IDS`              | `uint[100]`   | Quest id, 0 on an unused entry                        |
| 2513      | `STORY_QUEST_CHECKPOINTS`      | `uint[20000]` | 200 checkpoint hashes per quest                       |
| 2514      | `STORY_QUEST_CHECKPOINTS_LIVE` | `uint[20000]` | As 2513, entries going to 4294967295 during the quest |

- 2510 holds 59 ids, `00100000` to `0010d001`.
- Each story quest record has three parts, each a flag and 200 values: 2511 with 2513, 2512 with 2514 and 2522 with 2515. Entry `i` of 2513-2515 starts at `i` \* 200. 2516 holds 32 values per quest.
- The quest underway keeps checkpoint hashes in its 2513 and 2514 parts. At its clear 2511, 2512 and 2522 go to 1 and both parts are zeroed.
- Quests played as one run share a single record change. `00101003`, `00101004` and `00101005` all turn 1 in one write at the end of the run, and the later two never hold a checkpoint. Other story quests clear singly, each with its own record change, such as `00102000`, `00102f00`, `00102002` and `00103f00`.

### Restart point

| Attribute | Type      | Holds                                  |
| --------- | --------- | -------------------------------------- |
| 2517      | `uint[2]` | Quest id, 0 when none                  |
| 2518      | `uint[2]` | Checkpoint hash                        |
| 2519      | `int[2]`  | Chapter key, -1 when none              |
| 2520      | `bool[2]` | Likely the flag `FUN_140631c20` checks |

Two entries each, solo then online as in 2506. `FUN_14061d110` and `FUN_14061e0a0` copy them to and from runtime fields.

`FUN_140631c20` restarts from them: it does nothing when the 2517 id has no family digit, sets the current chapter to 2519 and starts the quest in 2517 at the checkpoint in 2518. With the flag set, it first drops entries of a list whose key lies from 2519 up to the current chapter. `FUN_14063d2a0` clears 2517, 2519 and the flag, leaving 2518.

They are set at a checkpoint inside `00101003`, hold through the rest of that run and clear at the record change. What calls `FUN_140631c20` has not been found.

## Chapters

Chapter select lists the chapters reached, by `chapter_select.Key`: chapter group \* 20 + chapter within the group.

| Attribute | Name              | Type     | Holds                                           |
| --------- | ----------------- | -------- | ----------------------------------------------- |
| 2506      | `CURRENT_CHAPTER` | `int[2]` | Chapter key underway, solo then online, -1 none |
| 2590      | `CHAPTER_KEYS`    | `int[]`  | Chapter key, one per chapter reached            |
| 2591      | `CHAPTER_FLAGS`   | `int[]`  | 1 on a chapter chapter select offers            |

- 2590-2596 are parallel lists apart from 2595 and 2596, which run shorter.
- A key joins 2590 as 2506 moves past it, together with any keys skipped. This can fall at a quest's clear or at a checkpoint with no clear.
- `chapter_select.QuestId` can give several keys one quest, as 101-104 share `00103001`. That quest's record clears once, and keys never current in 2506 still join 2590 at the clear.
- 2502, an `int`, is the current town, by `chapter_select.TownStageMaybe`: 3072 (`0xC00`) from a new game, then 3328 (`0xD00`, Seedhollow) as `00104f00` clears, ahead of key 121. 2503, a `uint`, takes a new checkpoint hash in the same write.
- Chapter select (`FUN_1403f4140`) offers the chapter groups in order. It stops at the first chapter missing from 2590, or listed with bit 0 of its flags clear and a negative second value.

## Quest seed

2504 `QUEST_SEED`, a `uint`, is drawn at a quest start from `timeGetTime` through a xorshift (`FUN_141fa76c0`), or kept when a quest resumes. Within a run of story quests it is drawn once, at the record change at the end of the run, while 7601 is replaced at the end of each quest.

## Side quests

Three arrays of 200.

| Attribute | Name                  | Type        | Holds                                    |
| --------- | --------------------- | ----------- | ---------------------------------------- |
| 2550      | `SIDE_QUEST_IDS`      | `uint[200]` | Quest id, 0 on an unused entry           |
| 2551      | `SIDE_QUEST_STATE`    | `uint[200]` | 0 until completed, 1 or 2 once completed |
| 2555      | `SIDE_QUEST_ACCEPTED` | `bool[200]` | Accepted                                 |

- 2550 holds every side quest from a new game on, accepted or not.
- An accepted quest at 0 in 2551 is underway.
- 2552, a `uint[12800]`, holds 64 values per side quest. Its first value takes a hash on quests not yet accepted, as a story chapter ends. The hashes match no table text or message key, and no meaning is assigned.
- A completed repeat quest stays accepted in 2555. The game lists it only once it is accepted again.

## Quest counter

Four arrays of 512.

| Attribute | Name                         | Type        | Holds                            |
| --------- | ---------------------------- | ----------- | -------------------------------- |
| 2570      | `COUNTER_QUEST_IDS`          | `uint[512]` | Quest id, 0 on an unused entry   |
| 2571      | `COUNTER_QUEST_CLEARS`       | `uint[512]` | Clear count                      |
| 2574      | `COUNTER_QUEST_FLAGS`        | `uint[512]` | Best grade                       |
| 2579      | `COUNTER_QUEST_LAST_CLEARED` | `uint[512]` | Last clear, Unix time in seconds |

- 2570 holds every quest counter quest from a new game on.
- The fifth digit of the id is the difficulty.
- 2571 sums to `PROFILE_QUESTS_CLEARED` (4901) on the own profile card.
- 2579 is recorded from game version 2.0.0 on. A quest not cleared since holds 0.
- Ids with no clears include ids not in `quest_baseinfo_ex_data`.

| Digit | Difficulty |
| ----- | ---------- |
| 1     | Easy       |
| 2     | Normal     |
| 3     | Hard       |
| 4     | Very Hard  |
| 5     | Extreme    |
| 6     | Maniac     |
| 7     | Proud      |
| 8     | Chaos      |
| 9     | Chaos+     |
| A     | Chaos++    |
| B     | Infinity   |

| 2574 | Best grade    |
| ---- | ------------- |
| 0    | C             |
| 1    | B             |
| 2    | A             |
| 3    | S             |
| 4    | S+            |
| 5    | S++           |
| 7    | Never cleared |

## Fate quests

Two arrays of 100, for the episodes that are a quest (`fate_episode.MissionQuestId`).

| Attribute | Name                 | Type        | Holds                          |
| --------- | -------------------- | ----------- | ------------------------------ |
| 2560      | `FATE_QUEST_IDS`     | `uint[100]` | Quest id, 0 on an unused entry |
| 2561      | `FATE_QUEST_CLEARED` | `uint[100]` | 1 once cleared                 |

- 2560 holds every fate quest from a new game on, 56 ids for the 58 quest episodes: the captain's two characters share theirs.
- 2561 is set on returning from the quest, after the episode's completion.

## Information quests

7351 `INFORMATION_QUEST_ID`, a `uint` at entities 0-127, holds the quest counter ids of `infomation_quest`, 0 on an unused entity. 7352 sits beside it.

## Islands

6101 `ISLAND_KEY`, a `uint` at entities 0-31, holds the hash of each `island.Key`, the empty hash on an unused entity. 6102 is a `bool` beside it.

## Open

- 2551 is 2 only on a repeat quest, likely a clear count.
- 2505 at entity 0 lists the accepted side quests again, in another order. 2554 is false on every entry.
- 2575 is true on every cleared quest apart from the On the Threshold quests. 2576 is true on every cleared quest. 2577 holds three bools per quest that do not follow the first clear rewards. 2578 is mostly true alongside a 2579 time.
- 2511, 2512 and 2522 all turn 1 at a story quest's clear. Which one marks the clear is not settled.
- 2580-2583 and 2501-2651 apart from the attributes above have no meaning assigned.
- 7352 has no meaning assigned. It goes from 0 to 1 on some information quests during story play, before the quest underway clears.
- 6102 goes from false to true on an island during story play, likely by `island.ChapterIdMaybe`: `ISLAND_2ST` (4) in story Chapter 4 and `ISLAND_3ST` (5) one poll before `00103f00` clears. `island.QuestID` does not decide it, since a town island can be true with its quest not cleared.
- 2592 and 2594 gain an entry of 0 when a chapter joins 2590. 2593 is registered as a `SaveDataUnitVariable`, but a save can hold no unit for it. None has a meaning assigned.
- 2595 and 2596 gain an entry when a chapter group's last chapter joins 2590, not on every chapter. 2595 takes the group (key / 20) and 2596 takes 0. Neither has a meaning assigned.
- 2605, a `uint[2]`, copies 7601 index 130 into index 1 as 2504 is drawn. Index 0 stays 0.
- 2903 and 2904, `ulong` lists, go from four values each to empty at a story quest clear, and from empty to four values each one poll before the record change that ends a run of quests. 2905 and 2906, the same type, go from empty to four and six values one poll before the record change of `00104f00`. None has a meaning assigned.
