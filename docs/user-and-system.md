# User and system data

SystemData and the start of SlotData hold the save-wide state: save versions, the play timer, the current stage, the player name, currencies and a few unnamed counters and flag sets. Every attribute here has a single unit at entity 0, apart from the list in [Story play units](#story-play-units).

## SystemData

SystemData uses attributes 801-841 and has no version field.

| Attribute | Name                   | Type       | Holds                                                 |
| --------- | ---------------------- | ---------- | ----------------------------------------------------- |
| 801       | not named              | `ushort`   |                                                       |
| 802       | not named              | `ushort`   |                                                       |
| 803       | `SYSTEM_HASHSEED`      | `uint`     | Copy of 1003                                          |
| 811       | `SYSTEM_HASHSEED_2`    | `uint`     | Copy of 1003                                          |
| 812       | `SYSTEM_PLAY_TIME`     | `ulong`    | Play time in seconds, capped at 3,599,999 (999:59:59) |
| 813       | `SYSTEM_STAGE`         | `int`      | Stage, see [Location](#location)                      |
| 814       | `SYSTEM_PLAYER_NAME`   | `byte[64]` | Player name, one byte per character, padded with 0    |
| 815       | not named              | `uint`     |                                                       |
| 816       | not named              | `byte`     |                                                       |
| 817       | not named              | `byte`     |                                                       |
| 818       | not named              | `int`      |                                                       |
| 819       | `SYSTEM_STAGE_2`       | `int`      | Stage, see [Location](#location)                      |
| 820       | not named              | `bool`     |                                                       |
| 822       | not named              | `int[4]`   |                                                       |
| 823       | not named              | `int[4]`   |                                                       |
| 824       | not named              | `bool`     |                                                       |
| 825       | not named              | `bool`     |                                                       |
| 826       | not named              | `bool`     |                                                       |
| 827       | not named              | `bool`     |                                                       |
| 828       | not named              | `bool`     |                                                       |
| 829       | not named              | `bool`     |                                                       |
| 830       | not named              | `byte`     |                                                       |
| 831       | not named              | `bool`     |                                                       |
| 832       | not named              | `bool`     |                                                       |
| 833       | not named              | `int`      |                                                       |
| 834       | `SYSTEM_PLAYER_NAME_2` | `byte[64]` | Player name, one byte per character, padded with 0    |
| 835       | not named              | `bool`     |                                                       |
| 836       | not named              | `byte`     |                                                       |
| 837       | not named              | `bool`     |                                                       |
| 838       | not named              | `bool`     |                                                       |
| 839       | not named              | `ubyte`    |                                                       |
| 840       | not named              | `ubyte`    |                                                       |
| 841       | not named              | `bool`     |                                                       |

## SlotData versions

| Attribute | Name                   | Type     | Holds                                                     |
| --------- | ---------------------- | -------- | --------------------------------------------------------- |
| 1001      | `SAVE_SLOT_VERSION`    | `ushort` | Slot serialization version: 31 on game 2.0.5, 32 on 2.0.6 |
| 1002      | `SAVE_FEATURE_VERSION` | `ushort` | Feature version, 6 on game 2.0.1                          |
| 1003      | `SAVE_HASHSEED`        | `uint`   | Random seed generated with the save                       |

The game rejects a save whose 1001 or 1002 is higher than its own version expects.

## User data

User data uses attributes 1101-1151.

| Attribute | Name                       | Type         | Holds                                                               |
| --------- | -------------------------- | ------------ | ------------------------------------------------------------------- |
| 1101      | `USER_PLAYER_NAME`         | `ushort[32]` | Player name, one character code per value, padded with 0            |
| 1102      | not named                  | `int`        | Always 1                                                            |
| 1103      | `CAPTAIN`                  | `int`        | Captain picked at the start: 1 Gran, 2 Djeeta                       |
| 1104      | `USER_RUPIES`              | `int`        | Rupies                                                              |
| 1105      | `USER_TRANSMARVEL_POINTS`  | `int`        | Transmarvel points, 150 per Transmarvel Stock                       |
| 1106      | `USER_COMMENDATIONS`       | `int`        | Commendations, as the player page shows                             |
| 1107      | not named                  | `bool`       |                                                                     |
| 1108      | `USER_ONLINE_STATUS_FLAGS` | `uint`       | Online status flags                                                 |
| 1109      | not named                  | `int`        |                                                                     |
| 1110      | not named                  | `int`        |                                                                     |
| 1111      | not named                  | `int`        |                                                                     |
| 1112      | `USER_MASTERY_POINTS`      | `int`        | MSP                                                                 |
| 1113      | not named                  | `bool[256]`  | Flag set                                                            |
| 1114      | not named                  | `bool`       |                                                                     |
| 1115      | not named                  | `uint`       | Hash-like                                                           |
| 1116      | `RESONANCE_POINTS`         | `int`        | Resonance points, spent on the Resonance tree                       |
| 1151      | not named                  | `uint[58]`   | One entry per value: the low byte is its index, the high byte flags |

The player name also appears at 4413 and 4506.

A Transmutation pull adds its `gacha.TransmarvelEarned` to 1105, 15 per pull at Level 3, and a Transmarvel pull takes `gacha.TransmarvelCost`, 150. The Transmarvel Stock the game shows is 1105 / 150, and the remainder fills its bar.

## Location

Location uses attributes 1201-1207.

| Attribute | Name                | Type        | Holds                                                                          |
| --------- | ------------------- | ----------- | ------------------------------------------------------------------------------ |
| 1201      | `LOCATION_STAGE`    | `int`       | Current stage, a `stagename.PhaseId`                                           |
| 1202      | `LOCATION_SPOT`     | `ubyte[32]` | Spot name, ASCII padded with 0                                                 |
| 1203      | not named           | `uint`      |                                                                                |
| 1204      | not named           | `float[4]`  |                                                                                |
| 1205      | not named           | `float[4]`  |                                                                                |
| 1206      | `LOCATION_PARTY_HP` | `int[4]`    | Current HP per party slot at the save, 0 on a slot with nothing to restore     |
| 1207      | not named           | `int[4]`    | A combat gauge per party slot at the save, 0 on a slot with nothing to restore |

Spawning a party member (`FUN_1406c6680`, the player in `FUN_1406c5ea0`) restores both from its slot. HP takes the 1206 value capped at the character's maximum, so a value left stale by an edit corrects itself. The gauge gains the 1207 value through `FUN_140bb2940`, which caps at the gauge's maximum. Other callers pass it a percentage times 0.01. A value of 0 skips the restore. `FUN_1436e1dd0`, on `EtEndlessModeShop`, zeroes both on the slots where `FUN_140373970` is false.

Live, both hold 0 apart from the moment of a save. 1207 rises through a story quest, stops at 1000 and can drop to 0 on one slot. Which gauge it is has not been confirmed in game; the Skybound Art gauge fits.

`stagename.PhaseId` spells the stage as 8 hex digits, so stage `0xC00` is PhaseId `00000C00`, Folca, Frontier Town. `stagename.Name` is a text key in `text_telop` or `text_ui`. The opening stage `0xA01` has no `stagename` row.

A teleport changes 1201 and SystemData 813 and 819 together. At the start of a new game, 813 and 819 hold `0x800`, Grandcypher Deck, while 1201 holds the opening stage. 1202 stays the same after a teleport.

## Slimes

| Attribute | Name             | Type   | Entities | Holds                                 |
| --------- | ---------------- | ------ | -------- | ------------------------------------- |
| 7801      | `SLIME_ID`       | `uint` | 0-255    | Slime id, `0x10X000NN`, 0 when unused |
| 7802      | not named        | `uint` | 0-255    | A separate list of ids, `0x209000NN`  |
| 7803      | `SLIME_DEFEATED` | `uint` | 0-255    | 1 once the slime in 7801 is defeated  |

7801 holds 25 ids, the `ReqQuantity` of badge 91 "Defeat every slime". A slime's first defeat in the main story sets its 7803 and adds 1 to `TROPHY_PROGRESS` (5815) at 52 and 53.

## Story play units

Units that move during story play, with no meaning assigned and no domain of their own yet.

| Attribute | Name                        | Type      | Entities | Holds                                                             |
| --------- | --------------------------- | --------- | -------- | ----------------------------------------------------------------- |
| 4103      | not named                   | `uint[3]` | 0        | Three 4001 keys, see below                                        |
| 4201      | `TOWN_EVENT_KEY`            | `uint`    | 0-63     | Hash of a town event id, or the empty hash on an unused entity    |
| 4202      | `TOWN_EVENT_PLAYED`         | `uint`    | 0-63     | 1 once the 4201 event has played                                  |
| 4318      | not named                   | `bool`    | 0        | Goes from false to true in `00107001`                             |
| 4331      | not named                   | `bool`    | 0        | Goes from false to true in a story quest                          |
| 7303      | `QUEST_DIFFICULTY_UNLOCKED` | `int`     | 0        | Highest quest difficulty unlocked, by the id digit in `quests.md` |
| 8901      | not named                   | `uint`    | 0        | Goes from 0 to 1 as a story party's slots are released            |
| 8907      | not named                   | `uint[7]` | 0        | Value 2 goes from 0 to 1 just after `ITEM_70_0010`                |

- 4103 changes at the end of a story or quest counter quest. The three 4001 rows it names take 8 in 4003 if they held 0, then 10 seconds later, the rows it no longer names going back to 8.
- 7303 goes 2 to 3 with trophy 22 "Unlock Hard quests", 3 to 4 with trophy 23 "Unlock Very Hard quests", 4 to 5 with trophy 24 "Unlock Extreme quests", 5 to 6 with trophy 25 "Unlock Maniac quests" and 6 to 7 with trophy 542 "Unlock Proud quests". 22 and 23 arrive just after a Rolan note moves, well after their `badge.QuestId` clears; 24 just after `0010A001` clears; 25 with its `QuestId`, `0010A031`, underway; 542 in the record write of its `QuestId`, `00407101`, the first Proud quest.
- 7313, a `uint`, goes 0 to 1 8 s after the record write of `00407318`, in the poll where 7103 takes `ShopWeaponLimitBreak`. It has no meaning assigned.
- 7301 and 7302 are the information dialogs, see [`tutorials.md`](tutorials.md).
- 4201 at 13 holds `WD_MS170_010_0000`, the `short_story_return.QuestId4` played on the return to town after `00407318`, before `00725110`. 4202 there goes 0 to 1 in the record write of `00407318`. `ShopWeaponLimitBreak` (Limit Break) and `ShopRebuild` (Weapon Transcendence) at Siero's Knickknack Shack check it (`FUN_140441510`); `ShopRebuild` also needs `00408311`, `00408312` or `00408302` cleared (`FUN_140442240`). A load does not set 4202 by itself, so a save that skips the event never opens either shop.
- The other 4201 hashes match no table text or message key.
- 4331 sits among 4328-4334, a run of `bool` and `byte` units at entity 0.
- 8901 sits beside 8902 and 8904, the counters that climb by one per save.
