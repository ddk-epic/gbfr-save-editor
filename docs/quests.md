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
| `007`  | Short stories        |

- A quest's title is `TXT_QR_<id without the leading 00>` in `text_stage.msg`.
- The sixth digit is the quest's family: `FUN_14061d110`, which copies the game's quest records into the save, sorts them by it. 1 is story, 2 side, 3 fate, 4 quest counter and 7 the short stories of 2580.

## Story quests

| Attribute | Name                           | Type          | Holds                                                 |
| --------- | ------------------------------ | ------------- | ----------------------------------------------------- |
| 2510      | `STORY_QUEST_IDS`              | `uint[100]`   | Quest id, 0 on an unused entry                        |
| 2513      | `STORY_QUEST_CHECKPOINTS`      | `uint[20000]` | 200 checkpoint hashes per quest                       |
| 2514      | `STORY_QUEST_CHECKPOINTS_LIVE` | `uint[20000]` | As 2513, entries going to 4294967295 during the quest |

- 2510 holds 59 ids, `00100000` to `0010d001`.
- Each story quest record has three parts, each a flag and 200 values: 2511 with 2513, 2512 with 2514 and 2522 with 2515. Entry `i` of 2513-2515 starts at `i` \* 200. 2516 holds 32 values per quest.
- The quest underway keeps checkpoint hashes in its 2513 and 2514 parts. At its clear 2511, 2512 and 2522 go to 1 and both parts are zeroed.
- The first value of a part holds the current checkpoint, the `guid_` of a `BeginSection` in the quest's `quest_<id>_0_fsm_ingame.msg`. Later values hold objectives: each takes a hash in both parts, and when it is done, after a story row or a fight, the 2514 value goes to 4294967295 while 2513 keeps the hash. Some are marked as they are written and some stay unmarked until the clear.
- Quests played as one run share a single record change. `00101003`, `00101004` and `00101005` all turn 1 in one write at the end of the run, and the later two never hold a checkpoint. `00106001` and `00106002` run the same way. Two keyless quests clear in another quest's write without being a run: `00107002` with `00107f00`, before `00107001` is played, and `00107003` with `00107001`. The Final Chapter clears `00108f00`, `00108000`, `00108002` and `00108001` in that order, each in its own write with its own 2504. Other story quests clear singly, each with its own record change, such as `00102000`, `00102f00`, `00102002` and `00103f00`.
- 2516 takes 1 at entries 1 and 2 of `00106001` for one checkpoint, the only move seen.
- 2515 takes the 2513 hash of `0010A000` at its second section and zeroes at its clear, the only move seen.
- 2501, a `uint`, goes 0 to 1 in the write of the first quest counter clear after `00109002` and `0010A002`. Those two take 2511 and 2522 only, and every 2512 part at 1 goes to 0. As the next story quest begins, `0010A000` and `0010A010`, 2501 goes back to 0 and the 2512 parts return to 1. `FUN_14061d110` copies 2501 from the play mode at quest object `+0xdd4`, and a new game sets it to 1.

### Restart point

| Attribute | Name                     | Type      | Holds                              |
| --------- | ------------------------ | --------- | ---------------------------------- |
| 2517      | `RESTART_QUEST`          | `uint[2]` | Quest id, 0 when none              |
| 2518      | `RESTART_CHECKPOINT`     | `uint[2]` | Checkpoint hash                    |
| 2519      | `RESTART_CHAPTER`        | `int[2]`  | Chapter key, -1 when none          |
| 2520      | `RESTART_CHAPTER_PASSED` | `bool[2]` | True once 2506 has moved past 2519 |

Two entries each, solo then online as in 2506. `FUN_14061d110` and `FUN_14061e0a0` copy them to and from runtime fields.

`FUN_140631c20` restarts from them: it does nothing when the 2517 id has no family digit, sets the current chapter to 2519 and starts the quest in 2517 at the checkpoint in 2518. With 2520 set, it first drops entries of a list whose key lies from 2519 up to the current chapter, which fits undoing a key that joined 2590 after the restart point. `FUN_14063d2a0` clears 2517, 2519 and 2520, leaving 2518.

They are set at a checkpoint inside a quest, such as `00101003`, `00104001` or `0010AF02`, hold through the rest of it and clear at the record change. While 2520 is true, the first value of the quest's 2514 part stays at the restart checkpoint and its 2513 part moves on. That first value can also lag 2513 with 2517-2520 unmoved and 2520 false, over checkpoints in `00107001`, until a later checkpoint writes both. What calls `FUN_140631c20` has not been found.

## Chapters

Chapter select lists the chapters reached, by `chapter_select.Key`: chapter group \* 20 + chapter within the group.

| Attribute | Name              | Type     | Holds                                           |
| --------- | ----------------- | -------- | ----------------------------------------------- |
| 2502      | `CURRENT_TOWN`    | `int`    | Town, by `chapter_select.TownStageMaybe`        |
| 2506      | `CURRENT_CHAPTER` | `int[2]` | Chapter key underway, solo then online, -1 none |
| 2590      | `CHAPTER_KEYS`    | `int[]`  | Chapter key, one per chapter reached            |
| 2591      | `CHAPTER_FLAGS`   | `int[]`  | 1 on a chapter chapter select offers            |
| 2595      | `CHAPTER_GROUPS`  | `int[]`  | Chapter group, key / 20, one per group finished |

- 2590-2596 are parallel lists apart from 2595 and 2596, which run shorter.
- A key joins 2590 as 2506 moves past it, together with any keys skipped. This can fall at a quest's clear or at a checkpoint with no clear. A key's own quest can clear with the key still current, when a quest with no `chapter_select` row follows it: key 143 names `00105f01` and joins at the clear of `00105002`, and key 160 names `00106f00` and joins at the clear of `00106000`. Key 220 names `00109001` and joins as `0010A000` begins, well after that clear.
- `chapter_select.QuestId` can give several keys one quest, as 101-104 share `00103001`. That quest's record clears once, and keys never current in 2506 still join 2590 at the clear.
- 2502 follows `chapter_select.TownStageMaybe`, moving at the clear ahead of the key that changes it. It holds 3072 (`0xC00`) from a new game, 3328 (`0xD00`, Seedhollow) as `00104f00` clears, ahead of key 121, 3329 (`0xD01`) as `00106f00` clears and 3330 (`0xD02`) as `00106002` clears. Key 200 is the one miss so far: it names `0xD00`, and 2502 stays `0xD02` through it, going to 3072 (`0xC00`) as `00108001` clears, ahead of key 220. 2503, a `uint`, takes a new checkpoint hash in the same write, and again at a checkpoint with 2502 unchanged.
- Chapter select (`FUN_1403f4140`) offers the chapter groups in order. It stops at the first chapter missing from 2590, or listed with bit 0 of its flags clear and a negative second value.

## Quest seed

2504 `QUEST_SEED`, a `uint`, is drawn at a quest start from `timeGetTime` through a xorshift (`FUN_141fa76c0`), or kept when a quest resumes. Within a run of story quests it is drawn once, at the record change at the end of the run, while 7601 is replaced at the end of each quest. A quest counter clear draws none: 2504 holds through them until the next story quest begins.

## Side quests

Three arrays of 200.

| Attribute | Name                  | Type        | Holds                                    |
| --------- | --------------------- | ----------- | ---------------------------------------- |
| 2550      | `SIDE_QUEST_IDS`      | `uint[200]` | Quest id, 0 on an unused entry           |
| 2551      | `SIDE_QUEST_STATE`    | `uint[200]` | 0 until completed, 1 or 2 once completed |
| 2555      | `SIDE_QUEST_ACCEPTED` | `bool[200]` | Accepted                                 |

- 2550 holds every side quest from a new game on, accepted or not.
- An accepted quest at 0 in 2551 is underway.
- 2552, a `uint[12800]`, holds 64 values per side quest. Its first value takes a hash on quests not yet accepted, as a story chapter ends or at a quest counter quest's record write. These are likely `BeginSection` guids, by the shape shared with 2582; the hashes match no table text or message key.
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

## Short stories

Family 7, script quests with no story or quest counter entry, cleared by `ClearQuest` and `ClearShortStory` in scripts. 133 ids with the prefixes `0070`-`0073` and `007f`. Parallel arrays at entity 0, in the same order.

| Attribute | Name                      | Type         | Holds                          |
| --------- | ------------------------- | ------------ | ------------------------------ |
| 2580      | `SHORT_STORY_IDS`         | `uint[150]`  | Quest id, 0 on an unused entry |
| 2581      | `SHORT_STORY_CLEARS`      | `uint[150]`  | Clear count                    |
| 2582      | `SHORT_STORY_CHECKPOINTS` | `uint[9600]` | 64 values per quest            |

- The first 2582 value holds the current `BeginSection` guid of a quest underway, and goes to 0 as 2581 rises.
- `occurrenceList_` in `baseinfo.msg` opens each one: type 1 entries name quests that must be cleared, and type 4 entries count clears of quest counter quests at the difficulty digit in `id_`, `count_` of them. First clears only have been seen, so clears and distinct quests are not told apart. Several can run and clear beside a story or quest counter quest.
- `00705001`-`00705007` run `UnlockArchive` for `ARC_ROLANNOTE_*` notes.
- `00703000` and `00703001` open on `00705004`, and `0010A000` opens on those two, so the story moves on with notes still missing. `0010A010` needs `00704000`, `00704001`, `0010A002`, `00705006` and `00705007`. `00705006` and `00705007` count 11 Extreme clears, `00705005` 8.
- `00704000` and `00704001`, and `00705006` and `00705007`, are pairs with one quest per town, `0xC00` and `0xD00`. Each runs `ClearShortStory` on its partner, so one town is enough and all four clear in one write.
- `00704000` and `00704001` test `IsArchiveWatched` eight times, which fits every `ARC_ROLANNOTE_*` note read.

## Information quests

7351 `INFORMATION_QUEST_ID`, a `uint` at entities 0-127, holds the quest counter ids of `infomation_quest`, 0 on an unused entity. 7352 `INFORMATION_QUEST_SHOWN`, a `uint` beside it, goes from 0 to 1 one record write ahead of 2575 on the same quest, on some information quests.

## Islands

6101 `ISLAND_KEY`, a `uint` at entities 0-31, holds the hash of each `island.Key`, the empty hash on an unused entity. 6102 `ISLAND_UNLOCKED`, a `bool` beside it, is true on an island reached.

- 6102 turns true during story play, likely by `island.ChapterIdMaybe`: `ISLAND_2ST` (4) in story Chapter 4, `ISLAND_3ST` (5) one poll before `00103f00` clears, `ISLAND_4ST` (6) after `00104000` clears, `ISLAND_5ST` (7) just before `00105f00` clears, `ISLAND_6ST` (8) just before `00106f00` clears and `ISLAND_7ST` (9) 18 s before `00107f00` clears. `ISLAND_8ST` has a `ChapterIdMaybe` of -1 and still turns true, over 11 minutes before `00108f00` clears, so the column does not cover every island. `island.QuestID` does not decide it, since a town island can be true with its quest not cleared.

## Menu unlocks

| Attribute | Name                | Type   | Entities | Holds                       |
| --------- | ------------------- | ------ | -------- | --------------------------- |
| 7101      | `MENU_UNLOCK_KEY`   | `uint` | 0-62     | Hash of a `menu_unlock.Key` |
| 7102      | not named           | `bool` | 0-62     | No meaning assigned         |
| 7103      | `MENU_UNLOCK_FLAGS` | `uint` | 0-62     | Flags of the row, see below |

- 7102 can be false on a menu in use.
- 7103 goes from 0 to `menu_unlock.Unk6` some time after the row's condition is met, not at the moment: `BlacksmithWeaponLimit` and `BlacksmithWeaponCraft` after their `menu_unlock.QuestID` clears, `BlacksmithGemBuildup` after 2708 bit 1 sets.

## Open

- 2551 is 2 only on a repeat quest, likely a clear count.
- 2505 at entity 0 lists the accepted side quests again, in another order. 2554 is false on every entry.
- 2575 is true on every cleared quest apart from the On the Threshold quests. It also turns true on uncleared quests of one difficulty, in stages at record writes: a block at the first after 7303 rises, `00403` at 3, `00404` at 4, `00405` at 5, and in `00405` more at the third and eighth clears. Quests whose clear leads to a Rolan note stay false until that clear. 2576 is true on every cleared quest. 2577 holds three bools per quest that do not follow the first clear rewards. 2578 is mostly true alongside a 2579 time.
- 2511, 2512 and 2522 all turn 1 at a story quest's clear. Which one marks the clear is not settled. `00109002` and `0010A002` are the exceptions, see 2501.
- 2583, 4800 values beside 2580-2582, has no meaning assigned.
- 2508, an `int`, goes from 0 to 1 at a checkpoint early in `00104000`. It goes 1 to 2, 2 to 3 and 3 to 4 at the next checkpoint or record write after 7303 reaches 3, 4 and 5. No meaning is assigned.
- 2501-2651 apart from the attributes above have no meaning assigned.
- 2592 and 2594 gain an entry of 0 when a chapter joins 2590. 2593 is registered as a `SaveDataUnitVariable`, but a save can hold no unit for it. None has a meaning assigned.
- 2595 and 2596 gain an entry when a chapter group's last chapter joins 2590, not on every chapter. 2596 takes 0 and has no meaning assigned.
- 2605, a `uint[2]`, copies 7601 index 130 into index 1 at a record write, a story quest's or a quest counter quest's. It stays when 7601 has not moved, even with 2504 drawn. Index 0 stays 0.
- 2907 goes down by 1 at each quest end, and to 999 from 1 or at a story quest clear, as 2903 and 2904 empty. It takes 5 as they fill.
- 2903 and 2904, `ulong` lists, go from four values each to empty at a story quest clear, and from empty to four values each one poll before the record change that ends a run of quests, and one poll before that of `00108001`, which ends no run. 2905 and 2906, the same type, go from empty to four and six values one poll before the record change of `00104f00`, and back to empty one poll before that of `00104002`. They fill again, with other values, one poll before the record change of `00106001` and `00106002`, and empty one poll before that of `00107001`. None has a meaning assigned.
- 2600, 128 bools, has its first ten go true at once at a checkpoint early in `00109001`. No meaning is assigned.
- 2509, a `float[4]`, reads as a position and rotation. It takes values at a story quest's clear and at checkpoints in the next quest, goes to 0 at that quest's clear, and has held `0 0 0 1` after a clear. No meaning is assigned.
