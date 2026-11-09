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
| `007`  | Story cutscenes      |

- A quest's title is `TXT_QR_<id without the leading 00>` in `text_stage.msg`.
- The sixth digit is the quest's family: `FUN_14061d110`, which copies the game's quest records into the save, sorts them by it. 1 is story, 2 side, 3 fate, 4 quest counter and 7 the story cutscenes of 2580.

## Story quests

| Attribute | Name                           | Type          | Holds                                                 |
| --------- | ------------------------------ | ------------- | ----------------------------------------------------- |
| 2510      | `STORY_QUEST_IDS`              | `uint[100]`   | Quest id, 0 on an unused entry                        |
| 2511      | `STORY_QUEST_CLEARED`          | `uint[100]`   | 1 once cleared                                        |
| 2512      | `STORY_QUEST_LIVE_CLEARED`     | `uint[100]`   | 1 once cleared, reset in some play modes              |
| 2522      | `STORY_QUEST_THIRD_CLEARED`    | `uint[100]`   | 1 once cleared                                        |
| 2513      | `STORY_QUEST_CHECKPOINTS`      | `uint[20000]` | 200 checkpoint hashes per quest                       |
| 2514      | `STORY_QUEST_CHECKPOINTS_LIVE` | `uint[20000]` | As 2513, entries going to 4294967295 during the quest |

- 2510 holds 59 ids, `00100000` to `0010d001`.
- Each story quest record has three parts, each a flag and 200 values: 2511 with 2513, 2512 with 2514 and 2522 with 2515. Entry `i` of 2513-2515 starts at `i` \* 200. 2516 holds 32 values per quest.
- The quest underway keeps checkpoint hashes in its 2513 and 2514 parts. At its clear 2511, 2512 and 2522 go to 1 and both parts are zeroed.
- The first value of a part holds the current checkpoint, the `guid_` of a `BeginSection` in the quest's `quest_<id>_0_fsm_ingame.msg`. Later values hold objectives: each takes a hash in both parts, and when it is done, after a story row or a fight, the 2514 value goes to 4294967295 while 2513 keeps the hash. Some are marked as they are written and some stay unmarked until the clear.
- Quests played as one run share a single record change. `00101003`, `00101004` and `00101005` all turn 1 in one write at the end of the run, and the later two never hold a checkpoint. `00106001` and `00106002` run the same way. Two keyless quests clear in another quest's write without being a run: `00107002` with `00107f00`, before `00107001` is played, and `00107003` with `00107001`. The Final Chapter clears `00108f00`, `00108000`, `00108002` and `00108001` in that order, each in its own write with its own 2504. Other story quests clear singly, each with its own record change, such as `00102000`, `00102f00`, `00102002` and `00103f00`.
- 2516 takes 1 at entries 1 and 2 of `00106001` for one checkpoint, the only move seen.
- 2515 takes the 2513 hash of `0010A000` at its second section and zeroes at its clear, the only move seen.
- 2501, a `uint`, goes 0 to 1 in the write of the first quest counter clear after `00109002`, `0010A002` and `0010A031`. Those three take 2511 and 2522 only, and every 2512 part at 1 goes to 0. As the next story quest begins, `0010A000` and `0010A010`, 2501 goes back to 0 and the 2512 parts return to 1. No return has been seen after `0010A031`. `FUN_14061d110` copies 2501 from the play mode at quest object `+0xdd4`, and a new game sets it to 1.

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

| Attribute | Name                       | Type     | Holds                                              |
| --------- | -------------------------- | -------- | -------------------------------------------------- |
| 2502      | `CURRENT_TOWN`             | `int`    | Town, by `chapter_select.TownStageMaybe`           |
| 2503      | `CURRENT_TOWN_CHECKPOINT`  | `uint`   | Checkpoint hash in the town                        |
| 2506      | `CURRENT_CHAPTER`          | `int[2]` | Chapter key underway, solo then online, -1 none    |
| 2590      | `CHAPTER_KEYS`             | `int[]`  | Chapter key, one per chapter reached               |
| 2591      | `CHAPTER_BEST_DIFFICULTY`  | `int[]`  | Best difficulty cleared: 0 Story, 1 Action, 2 Hard |
| 2592      | `CHAPTER_ULTIMATE_CLEARED` | `int[]`  | 1 once cleared on Ultimate                         |
| 2594      | `CHAPTER_ULTIMATE_CLEARS`  | `int[]`  | Clears on Ultimate                                 |
| 2595      | `CHAPTER_GROUPS`           | `int[]`  | Chapter group, key / 20, one per group finished    |
| 2596      | `CHAPTER_GROUP_FLAGS`      | `int[]`  | One per group finished, no meaning assigned        |

- 2590-2594 are parallel lists. 2595 and 2596 run shorter.
- At runtime each chapter is a 16-byte entry at story object `+0xc70`: key, best difficulty, Ultimate flag and Ultimate clears. Matching these fields to 2591, 2592 and 2594 follows registration order and the values in saves; the copying code has not been found. 2592 and 2594 have held the same values so far.
- `MenuEpisodeDifficulty` (`FUN_1441ae950`) offers difficulty 3, Ultimate, on bit 0 of the flag, and a lower difficulty on the flag or when it is at most the best difficulty. `FUN_140aa1910` counts chapters whose clears reach a threshold. `cPTown` (`FUN_1437131c0`) raises the clears to 1 where the flag is set and they are below 1.
- A key joins 2590 as 2506 moves past it, together with any keys skipped. This can fall at a quest's clear or at a checkpoint with no clear. A key's own quest can clear with the key still current, when a quest with no `chapter_select` row follows it: key 143 names `00105f01` and joins at the clear of `00105002`, and key 160 names `00106f00` and joins at the clear of `00106000`. Key 220 names `00109001` and joins as `0010A000` begins, well after that clear.
- `chapter_select.QuestId` can give several keys one quest, as 101-104 share `00103001`. That quest's record clears once, and keys never current in 2506 still join 2590 at the clear.
- 2502 follows `chapter_select.TownStageMaybe`, moving at the clear ahead of the key that changes it. It holds 3072 (`0xC00`) from a new game, 3328 (`0xD00`, Seedhollow) as `00104f00` clears, ahead of key 121, 3329 (`0xD01`) as `00106f00` clears and 3330 (`0xD02`) as `00106002` clears. Key 200 is the one miss so far: it names `0xD00`, and 2502 stays `0xD02` through it, going to 3072 (`0xC00`) as `00108001` clears, ahead of key 220. 2503, a `uint`, takes a new checkpoint hash in the same write, and again at a checkpoint with 2502 unchanged.
- Key 240 is the Epilogue: `TELOP_CHAPTER_MAIN_120`, text `TXT_CHAPTER_MAIN_0120`, `QuestId` `00730201`, town `0xC00`. 2506 moves to it in the write where story cutscene `00730201` clears, with no 2590, 2595 or 5815 at 2 move.
- Keys 241-243 also use `TELOP_CHAPTER_MAIN_120` and town `0xC00`, with `QuestId` `0010B000`, `0010C001` and `0010D001`. 2506 moves to 242 in the record write of `00408315`, as `0010C001`, a story quest played as `PL2800` alone, clears, and to 243 in that of `00409315`, as `0010D001`, played as `PL2900` alone, clears. Key 243 also names `00730237` in `UnkQuestId`; its objective, `TXT_QT_10D001`, is "Reach the end of Conflux Cycle 4: Illusion".
- Chapter select (`FUN_1403f4140`) offers the chapter groups in order. It stops at the first chapter missing from 2590, or with bit 0 of 2592 clear and a negative 2591.

## Quest seed

2504 `QUEST_SEED`, a `uint`, is drawn at a quest start from `timeGetTime` through a xorshift (`FUN_141fa76c0`), or kept when a quest resumes. Within a run of story quests it is drawn once, at the record change at the end of the run, while 7601 is replaced at the end of each quest. A quest counter clear draws none: 2504 holds through them until the next story quest begins.

## Side quests

Three arrays of 200.

| Attribute | Name                  | Type        | Holds                                    |
| --------- | --------------------- | ----------- | ---------------------------------------- |
| 2550      | `SIDE_QUEST_IDS`      | `uint[200]` | Quest id, 0 on an unused entry           |
| 2551      | `SIDE_QUEST_STATE`    | `uint[200]` | 0 until completed, 1 or 2 once completed |
| 2555      | `SIDE_QUEST_ACCEPTED` | `bool[200]` | Accepted                                 |

2552 is `SIDE_QUEST_CHECKPOINTS`, 2553 `SIDE_QUEST_PROGRESS` and 2505 `SIDE_QUESTS_TAKEN`, all at entity 0.

- 2550 holds every side quest from a new game on, accepted or not.
- An accepted quest at 0 in 2551 is underway.
- 2552, a `uint[12800]`, holds 64 values per side quest. Its first value takes a hash on quests not yet accepted, as a story chapter ends or at a quest counter quest's record write. These are likely `BeginSection` guids, by the shape shared with 2582; the hashes match no table text or message key.
- 2553 `SIDE_QUEST_PROGRESS`, a `uint[6400]`, holds 32 values per side quest. The first counts the quest's objective and goes back to 0 as 2551 marks the quest completed. `00220001` "Complete the 3 quests given" counts 1 to 3 at the records of its quests. `00220002` takes 1 once one run of `00409320` collects 40 Sephira lusters (`ITEM_33_0002`, emptied at the quest's end). A side quest started from a Conflux run takes 1 at the run's end; see [Runs](conflux.md#runs). A quest turned in with items, such as `00220003`, completes with no 2553 move.
- 2505 adds a side quest at a record write, which can be the write that completes it. A side quest added with 2553 at 1 in the same write, such as `00220005` or `00230004`, completes at the next record write.
- Side quests started from Conflux runs are requirements of the `00730*` story cutscenes, cleared on the return to town.
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

### Opening a quest

`FUN_14061f4b0` tests `occurrenceList_` in `baseinfo.msg`, the same list as the story cutscenes. A type 1 entry passes when the named quest's clear count is above 0. A type 8 entry names a side quest and passes when `FUN_140c25f00` gives its state as 2 or more, or when the quest is in a set of quests underway; in the traces, the quests behind one open once that side quest is offered.

The Chapter Ø end checkpoint (`chapterZeroEnd`, key 222, the second part of Chapter Ø) takes 7303 to 6, as the game does with `0010A031` underway. The checkpoints after it are `promoteToProud`, `dlcStart`, `unlockProudQuests`, `advanceToEpilogue` and `unlockChaos`. `advanceStory` passes through each one the save has not reached.

`promoteToProud` marks the 18 quests that open another Maniac quest or `00407101` as cleared, and `00407101` itself, written as in the [story fill](story-progression/fill.md): 2571 to 1, 2574 to 0, 2575 and 2576 to true, 4901 at 10600 and 5815 at 20 up by 1, and 5815 at 19 up by 1, or at 238 for `00407101`. First clear rewards are not given. It sets 7303 to 7, and the fill sets trophy 542. It also writes the clear of `0010A031` as the first Maniac clear does: 2511 and 2522 to 1, its 2513 and 2514 sections to 0, every 2512 part to 0, 2501 to 1, key 222 into 2590-2592 and 2594, and group 11 into 2595 with 1 in 2596. With 2501 at 0 and `0010A031` underway, a save the later checkpoints move to key 241 starts `0010B000` on load. Eight other Maniac quests take 2575 to true, with no clears. A save is past it at 7303 7 with those quests cleared and every listed Maniac quest at 2575 true. `00406367` keeps 2575 false: it has no title and is unlisted on played saves, and badge 31 "Sent from the Heavens" needs the other 26.

The game pays the trophy 25 and 542 rewards by itself after a load.

| Quest                                | Opens on                             |
| ------------------------------------ | ------------------------------------ |
| `00406325`, `355`-`361`, `364`-`367` | `0010A031`                           |
| `00406351`                           | `00406356`                           |
| `00406352`                           | `00406355`                           |
| `00406353`                           | `00406325`                           |
| `00406354`                           | `00406358`                           |
| `00406324`                           | `00406357`                           |
| `00406327`                           | `00406360`, `00406364`               |
| `00406323`                           | `00406359`, `00406365`, `00406366`   |
| `00406331`, `00406337`               | `00406325`, `355`-`360`, `364`-`366` |
| `00406332`                           | `00406331`                           |
| `00406330`                           | `00406332`                           |
| `00406333`                           | `00406330`                           |
| `00406334`                           | `00406337`                           |
| `00406335`                           | `00406334`                           |
| `00406338`                           | `00406333`, `00406335`               |

The other `00406` rows in 2570 have no `baseinfo.msg`.

`unlockProudQuests` marks the 15 quests that open another Proud quest as cleared, written the same way with 5815 at 238: `00407301`-`00407304`, `00407310`-`00407320`. The other 10 take 2575 to true, with no clears. A save is past it once every prerequisite has a clear and every `00407` row has 2575 true.

The game does not take 2575 at a load with a row's conditions met. 7352 takes the row at the load, and 2575 follows at the next record write.

It also takes 2581 to 1 and the first 2582 value to 0 on `00710000` and `00710001`, so neither plays. `00710000` runs at stage `0xD00`, calling event 5921 and talk event `VT_MS17_0015`, and writes nothing else. A load at `0xC00` with its conditions met plays it there, part broken. `00710001` runs at `0xD00`, calling event 32768 and dialog `DLG_STG_LUCILIUS_VISION`, and `00407320` opens on it.

| Quest                                          | Opens on                           |
| ---------------------------------------------- | ---------------------------------- |
| `00407301`-`00407309`                          | `00407101`                         |
| `00407310`, `00407311`, `00407312`             | `00407301`-`00407304`              |
| `00407313`                                     | `00407312`                         |
| `00407314`                                     | `00407313`                         |
| `00407315`                                     | `00407314`                         |
| `00407316`, `00407317`                         | `00407310`, `00407311`             |
| `00407319`                                     | `00407315`, `00407316`, `00407317` |
| `00407318`                                     | `00407319`, `00710010`             |
| `00407322`                                     | `00407318`                         |
| `00407320`                                     | `00407318`, `00710001`, `00710010` |
| `00407321`, `00407323`, `00407324`, `00407325` | `00407320`                         |

### DLC start

The DLC starts at side quests `00220101` and `00220102`, which the first two Conflux runs start from. Their `occurrenceList_` (`quest/ex/<id>/baseinfo.msg`) needs no Proud quest:

- `00220101` needs `00104F00` cleared and town `0xD04`.
- `00220102` needs `00220101`, `00109002`, `00730055` and `00730060` cleared, town `0xD04` and a type 7 entry with id 0.
- `00730010`, `00730011` and `00730014` need `0010A031`, `00220102` and type 7 id 1; `00730011` and `00730014` also one Maniac clear. `00730021` needs `00730030`, `00730011` and `00730040`, town `0x310` and type 7 id 2.

`dlcStart` comes after `promoteToProud` and writes what the game writes from `00220101` to `00730021`. A save is past it at 2506 240 or later, or with the story cutscenes, side quests and cycles below done:

- 2581 to 1 and the first 2582 value to 0 on `00725000`, `00730053`, `00730100`, `00730060`, `00730055`, `00730061`, `00730065`, `00730030`, `00730014`, `00730011`, `00730010`, `00730040` and `00730021`.
- `00220101` and `00220102` completed: 2551 to 1, 2555 to true, the first 2552 and 2553 values to 0, and each added to 2505. The fill adds trophy 52, 5815 at 27 and one Crewmate Card (`ITEM_23_0000`) per quest.
- Conflux Cycles 1-3 cleared: 2610, 2649 and 2650 at indexes 0-2. The fill adds trophies 1594, 1595, 1253 and 1470 and 5815 at 1139, 1140 and 917. Scores (2611), packages (2639, 2642) and Resonance points are not written.
- Section hashes the game leaves at that point: 2582 on `00730090`, `00730020` and `00730012`, and 2552 on side quests `00240121` and `00220111`.

The other side quest rewards and the Conflux runs' battle trophies are left out.

### Reaching the Epilogue

`00730201` moves 2506 from 222 to 240 and plays the Epilogue's chapter fade-in. Its `occurrenceList_` (`quest/ex/730201/baseinfo.msg`) needs `00407318`, `00710000`, `00730021` and `0010A031` cleared, town `0xC00` and a type 7 entry with id 2. Its one section is a start and return section at `phaseNo` `0xC00`, `subPhaseHash` 939223336. `00730046` and `00730420` also need `00407318`, and `00710000` needs `00407315`-`00407317`.

`advanceToEpilogue` comes after `unlockProudQuests` and leaves `00730201` to the game. A save is past it at 2506 240 or later, or with the story cutscenes below cleared:

- 2581 to 1 and the first 2582 value to 0 on `00725110`, `00730420` and `00730046`.
- 2582 on `00730430`, the section hash the game leaves at that point.
- The save put in Folca: 1201, 2502 and 2606 to `0xC00`, 1202 to `START`, 2503 to 939223336. A save with 2502 at `0xC00` and 1201 at another stage loads in Folca over the void.

### Unlocking Chaos

7303 rises at the record of the first quest of each difficulty: 8 at `00408301`, 9 at `00409302`, 10 at `0040A305`. Each first quest opens on the last quest of the difficulty before and a story quest the game plays as `SLOT01` stand-ins:

| Quest                                        | Opens on                                       |
| -------------------------------------------- | ---------------------------------------------- |
| `00408301`                                   | `00407318`, `00730201`                         |
| `0010B000`                                   | `00730103`                                     |
| `0010B001`, `0010B002`                       | the one before, `00730102`                     |
| `00408302`, `00408311`, `00408312`           | `00408301`, `0010B001`                         |
| `0010C001`                                   | `00408315`, `00730311`, `0010B002`             |
| `00409302`                                   | `00408315`, `0010C001`                         |
| `0010D001`                                   | `00409315`, `00730225`, `0010C001`, `00220003` |
| `0040A305`                                   | `00409315`, `0010D001`                         |
| `0040A322`-`0040A330`, `0040B301`-`0040B314` | `0040A316`                                     |

- Inside each difficulty, quests open on the ones before, on `00730*` story cutscenes and on side quests: `00220001`-`00220003` among the Chaos+ quests, `00220004`, `00220005` and `00230001`-`00230004` among the Chaos++ ones. `00408305`, `00408314`, `00409303`, `00409307` and `00409312` need type 7 id 3, `0040A309`, `0040A313` and `0040A314` type 7 id 4.
- `00730331`-`00730338` each follow a Chaos or Chaos+ record and take one `FATE_PL2900_*` episode (3502) from 5 to 15, with an item.

`unlockChaos` comes after `advanceToEpilogue`. Counter quests are cleared as in `promoteToProud`, with 5815 at 557, 558 or 559 for a Chaos, Chaos+ or Chaos++ clear. Story quests are cleared as `0010A031` is in `promoteToProud`, and each chapter key joins 2590-2592 and 2594. A save is past it at 7303 8 with its quests and story cutscenes done.

- `unlockChaos`, to the start of `0010B002`: 7303 to 8, 2508 to 7, 2506 to 241 and key 240. `00408301` cleared, and story cutscenes `00730201`, `00730005`, `00730102` and `00730103`. 2582 on `00730006`, the 2582 values of `00730090` and `00730020` to 0. `0010B000` and `0010B001` cleared, and `0010B002` begun at section 1597052236 (`quest/ex/10b002/sectionlist.msg`), with 2512 set to 2511 and 2501 to 0. The summon `0010B001` gives, `su_So4900_TU`, written as at +3:35: summon id 1, trait `SKILL_013_00`, bonus `00D171E0`, levels 4 and 1, equipped in the first slot, 1453 at its row, 1454 and 1455 to 1. The save in Folca at `START`. On load the game resumes `0010B002`, which gives `su_So3300_TU`, the items 389, 391 and 393 and the guided summon equip tutorial (`CallTutorialAction` type 10), and clears it. The game writes the key 241 move, `00730103`'s clear and the `00730006` hash only as the run returns from `0xF21`, so the checkpoint writes them. `00730102` moves 2502 to `0xF21`, a stage a save does not load in: a save there loads at 1201, and `00730103`, which needs `0xF21` and starts `0010B000`, does not play.

Left out: the fight and its tutorials in `0010B001`, the story party sets it releases, quest seeds (2504), and quest rewards.

## Fate quests

Two arrays of 100, for the episodes that are a quest (`fate_episode.MissionQuestId`).

| Attribute | Name                 | Type        | Holds                          |
| --------- | -------------------- | ----------- | ------------------------------ |
| 2560      | `FATE_QUEST_IDS`     | `uint[100]` | Quest id, 0 on an unused entry |
| 2561      | `FATE_QUEST_CLEARED` | `uint[100]` | 1 once cleared                 |

- 2560 holds every fate quest from a new game on, 56 ids for the 58 quest episodes: the captain's two characters share theirs.
- 2561 is set on returning from the quest, after the episode's completion.

## Story cutscenes

Family 7, script quests with no story or quest counter entry, cleared by `ClearQuest` and `ClearShortStory` in scripts. 133 ids with the prefixes `0070`-`0073` and `007f`. Parallel arrays at entity 0, in the same order.

| Attribute | Name                         | Type         | Holds                          |
| --------- | ---------------------------- | ------------ | ------------------------------ |
| 2580      | `STORY_CUTSCENE_IDS`         | `uint[150]`  | Quest id, 0 on an unused entry |
| 2581      | `STORY_CUTSCENE_CLEARS`      | `uint[150]`  | Clear count                    |
| 2582      | `STORY_CUTSCENE_CHECKPOINTS` | `uint[9600]` | 64 values per quest            |

- The first 2582 value holds the current `BeginSection` guid of a quest underway, and goes to 0 as 2581 rises.
- `occurrenceList_` in `baseinfo.msg` opens each one: type 1 entries name quests that must be cleared, type 2 entries a town, type 3 entries quests that must not be cleared, and type 4 entries count clears of quest counter quests at the difficulty digit in `id_`, `count_` of them. Type 7 entries pass when entry `id_` (0-4) of a 5-entry array at `DAT_147c23338+0x2c` is non-zero (`FUN_14061f4b0`); the shape fits 2610, with ids 0-2 matching Conflux Cycles 1-3, but the array is not mapped. First clears only have been seen, so clears and distinct quests are not told apart. Several can run and clear beside a story or quest counter quest.
- `00705001`-`00705007` run `UnlockArchive` for `ARC_ROLANNOTE_*` notes.
- `00703000` and `00703001` open on `00705004`, and `0010A000` opens on those two, so the story moves on with notes still missing. `0010A010` needs `00704000`, `00704001`, `0010A002`, `00705006` and `00705007`. `00705006` and `00705007` count 11 Extreme clears, `00705005` 8.
- `00725100` needs `0010A025`, `00725101` needs `0010A031` and 10 Maniac clears, and `00710010` needs `00407101` and `0010A031`. Each also has a type 5 entry. `00710010` clears 3 s after its section. `00710000` needs `00407315`-`00407317` and has a type 5 entry. `00710001` needs `00407318`, `00710000` and town `0xD00`, and writes its section as 2502 returns to `0xD00`. Side quest `00230391` has the same `0010A031` and 10 Maniac conditions and writes with `00725101`.
- `00730207` clears at the record of the third Chaos quest cleared, as 5815 at 557 reaches 3: once after `00408301`, `00408311` and `00408312`, once after `00408301`, `00408311` and `00408302`. Its `baseinfo.msg` is not in the archive's known files, so its `occurrenceList_` has not been read.
- `00704000` and `00704001`, and `00705006` and `00705007`, are pairs with one quest per town, `0xC00` and `0xD00`. Each runs `ClearShortStory` on its partner, so one town is enough and all four clear in one write.
- `00704000` and `00704001` test `IsArchiveWatched` eight times, which fits every `ARC_ROLANNOTE_*` note read.

## Information quests

7351 `INFORMATION_QUEST_ID`, a `uint` at entities 0-127, holds the quest counter ids of `infomation_quest`, 0 on an unused entity. 7352 `INFORMATION_QUEST_SHOWN`, a `uint` beside it, goes from 0 to 1 one record write ahead of 2575 on the same quest. 2575 can also turn true with no 7352 move seen.

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
- 2575 is true on every cleared quest apart from the On the Threshold quests. A quest is listed at the counter with it false. It also turns true on uncleared quests of one difficulty, in stages at record writes: a block at the first after 7303 rises, `00403` at 3, `00404` at 4, `00405` at 5, `00406` at 6, `00407301`-`00407309` at 7, and in `00405` more at the third and eighth clears. Quests whose clear leads to a Rolan note stay false until that clear. `00407101`, the first Proud quest, opens on the eight `00406` Saga quests, `00406330`-`00406335`, `00406337` and `00406338`. `00407305` and `00407309` open on it, `00407310` on `00407301`-`00407304`, `00407317` on `00407310` and `00407311`, `00407319` on `00407315`-`00407317`, `00407318` on `00407319` and `00710010`, `00407322` on `00407318`, `00407320` on `00407318`, `00710001` and `00710010`, and `00407321` and `00407325` on `00407320`. 2576 is true on every cleared quest. 2577 holds three bools per quest that do not follow the first clear rewards. 2578 is mostly true alongside a 2579 time.
- 2511, 2512 and 2522 all turn 1 at a story quest's clear. Which one marks the clear is not settled. `00109002`, `0010A002` and `0010A031` are the exceptions, see 2501.
- The objective moves on with no story quest begun: `TXT_QT_TRYMANIAC_00` "Progress through Maniac quests" after `0010A031`, `TXT_QT_TRYPROUD_00` "Progress through Proud quests" after `00407101`. What sets them has not been found.
- 2583, 4800 values beside 2580-2582, has no meaning assigned.
- 2508, an `int`, goes from 0 to 1 at a checkpoint early in `00104000`. It goes 1 to 2, 2 to 3, 3 to 4 and 4 to 5 at the next checkpoint or record write after 7303 reaches 3, 4, 5 and 6, and 5 to 6 in the record write that takes 7303 to 7. On a load of a save at 0 it goes to 5 with the trophy 25 reward, and 5 to 6 with the trophy 542 reward once 7303 is 7. It goes 8 to 9 in the write after 7303 reaches 10, and 9 to 10 with no 7303 move, in the write that clears `00730237`, key 243's `UnkQuestId`. No meaning is assigned.
- 2501-2651 apart from the attributes above have no meaning assigned.
- 2592 and 2594 gain an entry of 0 when a chapter joins 2590. 2593 is registered as a `SaveDataUnitVariable`, but a save can hold no unit for it, and it has no meaning assigned.
- 2595 and 2596 gain an entry when a chapter group's last chapter joins 2590, not on every chapter. 2596 takes 0, and 1 on group 11, which closes with key 222, though a save can also hold 0 there. No code reading it has been found. 2506 stays 222 as key 222 joins 2590.
- 2502 moves in the record writes of `00407317`, `0xC00` to `0xD00`, and `00407318`, back to `0xC00` and to `0xD00` again 31 s later. 2606, an `int`, took the new town 28 s after that move, as 2636, an `int`, went 0 to 2 and back to 0 within 4 s. Each is one case, and neither has a meaning assigned.
- 2605, a `uint[2]`, copies 7601 index 130 into index 1 at a record write, a story quest's or a quest counter quest's. It stays when 7601 has not moved, even with 2504 drawn. Index 0 stays 0.
- 2907 goes down by 1 at each quest end, and to 999 from 1 or at a story quest clear, as 2903 and 2904 empty. It takes 5 as they fill.
- 2903 and 2904, `ulong` lists, go from four values each to empty at a story quest clear, and from empty to four values each one poll before the record change that ends a run of quests, and one poll before that of `00108001`, which ends no run. 2905 and 2906, the same type, go from empty to four and six values one poll before the record change of `00104f00`, and back to empty one poll before that of `00104002`. They fill again, with other values, one poll before the record change of `00106001` and `00106002`, and empty one poll before that of `00107001`. None has a meaning assigned.
- 2600, 128 bools, holds the UI features unlocked, by `UnlockUIAction.feature_` (`FUN_1432124f0`). A new save holds 8 and 9. `00101000` sets 7, `00101001` sets 8, and `00109001` sets 0-6, in the story quests through `0010A031`. `FUN_14420b280` and `FUN_14268d5e0` read 0 for the menu shortcuts, `FacilityFastTravelOpenDialog` reads 1, 2 and 3 for its destinations, `FUN_1403f3b90` reads 7, and `EtQuestCounter` reads 9. Offset 10 up from each holds `SetUITemporaryLockAction`'s temporary lock, in memory.
- 2509, a `float[4]`, reads as a position and rotation. It takes values at a story quest's clear and at checkpoints in the next quest, goes to 0 at that quest's clear, and has held `0 0 0 1` after a clear. No meaning is assigned.
