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

| Attribute | Name              | Type        | Holds                          |
| --------- | ----------------- | ----------- | ------------------------------ |
| 2510      | `STORY_QUEST_IDS` | `uint[100]` | Quest id, 0 on an unused entry |

- 2510 holds 59 ids, `00100000` to `0010d001`.
- Each story quest record has three parts, each a flag and 200 values: 2511 with 2513, 2512 with 2514 and 2522 with 2515. Entry `i` of 2513-2515 starts at `i` \* 200. 2516 holds 32 values per quest.
- The quest underway keeps checkpoint hashes in its 2513 part. At its clear 2511, 2512 and 2522 go to 1 and the 2513 part is zeroed.

## Chapters

Chapter select lists the chapters reached, by `chapter_select.Key`: chapter group \* 20 + chapter within the group.

| Attribute | Name              | Type     | Holds                                           |
| --------- | ----------------- | -------- | ----------------------------------------------- |
| 2506      | `CURRENT_CHAPTER` | `int[2]` | Chapter key underway, solo then online, -1 none |
| 2590      | `CHAPTER_KEYS`    | `int[]`  | Chapter key, one per chapter reached            |
| 2591      | `CHAPTER_FLAGS`   | `int[]`  | 1 on a chapter chapter select offers            |

- 2590-2596 are parallel lists apart from 2595 and 2596, which run shorter.
- Chapter select (`FUN_1403f4140`) offers the chapter groups in order. It stops at the first chapter missing from 2590, or listed with bit 0 of its flags clear and a negative second value.

## Quest seed

2504 `QUEST_SEED`, a `uint`, is drawn at each quest start from `timeGetTime` through a xorshift (`FUN_141fa76c0`), or kept when a quest resumes.

## Side quests

Three arrays of 200.

| Attribute | Name                  | Type        | Holds                                    |
| --------- | --------------------- | ----------- | ---------------------------------------- |
| 2550      | `SIDE_QUEST_IDS`      | `uint[200]` | Quest id, 0 on an unused entry           |
| 2551      | `SIDE_QUEST_STATE`    | `uint[200]` | 0 until completed, 1 or 2 once completed |
| 2555      | `SIDE_QUEST_ACCEPTED` | `bool[200]` | Accepted                                 |

- 2550 holds every side quest from a new game on, accepted or not.
- An accepted quest at 0 in 2551 is underway.
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

## Open

- 2551 is 2 only on a repeat quest, likely a clear count.
- 2505 at entity 0 lists the accepted side quests again, in another order. 2554 is false on every entry.
- 2575 is true on every cleared quest apart from the On the Threshold quests. 2576 is true on every cleared quest. 2577 holds three bools per quest that do not follow the first clear rewards. 2578 is mostly true alongside a 2579 time.
- 2511, 2512 and 2522 all turn 1 at a story quest's clear. Which one marks the clear is not settled.
- 2580-2583 and 2501-2651 apart from the attributes above have no meaning assigned.
- 7351 at 0-127 holds quest counter ids of `infomation_quest`, with 7352 beside it. No meaning is assigned.
