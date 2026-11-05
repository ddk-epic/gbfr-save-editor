# Story fill

`fillSkippedStory` adds what the chapters up to the save's current chapter should have left, for a save moved forward by `advanceStory`. It runs after the chapters, like `disableHints`. It reads `CURRENT_CHAPTER` (2506) and takes every row with a key at or below it. Each row checks the save first, so a played save, or a second run, changes nothing it already holds.

| Due by     | Key | Trophies        | Items                                 | Archives                                                           | UI features | Other                                          |
| ---------- | --- | --------------- | ------------------------------------- | ------------------------------------------------------------------ | ----------- | ---------------------------------------------- |
| Chapter 2  | 40  | 0, 10, 1, 1405  |                                       |                                                                    | 7           |                                                |
| Chapter 3  | 60  | 2, 1406         | `ITEM_70_0004` Rolan's Transceiver    |                                                                    |             |                                                |
| Chapter 4  | 80  | 3, 1407         | `ITEM_70_0005` Rebelwear              | `ARC_OTHER_011`                                                    |             | `WEP_PL0000_03`, `WEP_PL0100_03` replace `_01` |
| Chapter 5  | 100 | 4, 1408         |                                       |                                                                    |             |                                                |
| Chapter 6  | 120 | 5, 1409         |                                       |                                                                    |             |                                                |
| Chapter 7  | 140 | 6, 1410         |                                       |                                                                    |             |                                                |
| Chapter 8  | 160 | 7, 1411         | `ITEM_70_0006` Elpis, the Mind Sealer | `ARC_OTHER_026`, `ARC_OTHER_058`, `ARC_OTHER_059`, `ARC_OTHER_060` |             | `WEP_PL1900_A0`, `WEP_NP0300_01`               |
| Chapter 9  | 180 | 8, 1412         |                                       |                                                                    |             | `WEP_PL0000_99`, `WEP_PL0100_99`               |
| Chapter 10 | 200 | 9, 1413         | `ITEM_70_0010` Rolan's Notes          | `ARC_ROLANNOTE_08`                                                 |             | Stand-in weapons raised                        |
| Chapter Ø  | 220 | 11, 1397        |                                       |                                                                    | 0-6         | `PL1900` joins                                 |
| Story end  | 222 | 22-25, 19, 1398 |                                       | `ARC_ROLANNOTE_01`-`07`                                            |             | Short stories, counter quests, see below       |

## Checks and writes

| Kind          | Holds it when             | Writes                                                                                |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| Trophy        | 5801 at the key is true   | 5801, and adds 1 to 5815 at 501, or at 1018 for Keys 1395-1453                        |
| Item          | 1804 is not 0             | 1802 to 1, 1803 to 4, or 36 on `ITEM_70_0010`, 1804 to the next 1805, and 1805        |
| Archive       | 7902 bit 0 is set         | 7902 to bit 0, or bits 0 and 1 on `ARC_ROLANNOTE_08`, and adds 1 to 5815 at 46 and 47 |
| UI feature    | 2600 at the index is true | 2600 at the index to true                                                             |
| Weapon        | 7403 at its row is not 0  | The first free weapon entry, see below                                                |
| `PL1900`      | 1305 bit 0 is set         | See below                                                                             |
| Short story   | 2581 is not 0             | 2581 to 1                                                                             |
| Counter quest | 2571 is not 0             | See below                                                                             |

- 2600 holds one bool per `UnlockUIAction.feature_`, see [`quests.md`](../quests.md).
- 1804 stays set once an item is spent, so a story item used up later is not added again.
- 5815 at 2 takes the row's chapter key count and only rises: 4, 6, 9, 13, 18, 22, 26, 30, 36, 38, 41.

## Story end

Key 222 holds `0010A031` underway with all eight notes and the journal quests behind it. The save takes what the quests behind the notes would have left.

- Notes 02 and 03 take bits 0 and 1, the other five bit 0. Opening the notes menu sets bit 1 on those five.
- 2581 goes to 1 on `00705001`-`00705007`, `00703000`, `00703001`, `00720000`-`00720004`, `00704000` and `00704001`. The game clears `00725100` itself after a load.
- 7303 rises to 6, and trophies 22-25, 19 and 1398 are set. The game awards trophy 12 after a load, and trophy 13 on Hard with it.

The 25 counter quests that open those short stories are marked cleared: `00403201`, `202`, `301`, `302`, `307`-`309`, `312`, `00404101`, `309`-`311`, `313`, `316`, and `00405101`, `201`-`203`, `206`-`208`, `302`-`305`. Each takes 2571 to 1, 2574 to 0, 2575 and 2576 to true, and adds 1 to 4901 at 10600, 5815 at 20, and 5815 at 13 plus the difficulty digit. 2577 and 2579 stay. First clear rewards are not given.

The row also takes 2575 to true on the 19 uncleared quests the traced run holds open that a load leaves false: `00401301`, `303`, `305`, `306`, `310`, `311`, `315`, `316`, `00402301`, `302`, `308`, `313`-`316`, `00403303`, `311`, `00404204` and `317`.

| Trophy | Rupies, also on 5815 at 224 | `ITEM_10_0001` | `ITEM_10_0002` | `ITEM_10_0003` |
| ------ | --------------------------- | -------------- | -------------- | -------------- |
| 22     | 20000                       | 50             | 5              |                |
| 23     | 30000                       | 50             | 25             |                |
| 24     | 30000                       |                | 50             | 10             |

The game pays the trophy 25 reward by itself on a load, so trophy 25 writes none. The same load pays nothing for trophies 22-24.

## `00730050`

The row for key 140 takes 2581 to 1 and the first 2582 value to 0 on `00730050`. It clears during `00104000` in a played run, and a save that skips that quest only takes its section. 16 trophies name it as `QuestId`, and it is the key of `bubble_talk_progress_ex` progress 100.

## Weapons

Each added weapon takes the first free entry, counting ones the fill cleared: 2802 the next 2801, 2803, 2804, 2805 and 2815, with 7403 at its row to 4, and 2801. 7403 stays set when a weapon is later sold, so a weapon sold on a played save is not added again.

| Weapon               | XP     | Uncap | Flags (2815)                                 | Also                                                                                                        |
| -------------------- | ------ | ----- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `_03`, due Chapter 4 | 90     | 0     | 129 on the captain in play, 128 on the other | Clears the captain's `_01` entry. 1402 takes the new id on a captain equipping the `_01`. See outfits below |
| `_99`, due Chapter 9 | 162540 | 6     | 128                                          | 1402 on the captain not in play takes it. The captain in play's `_03` takes XP 1740, uncap 3                |

The stand-in weapons stay in the list after their quests, flags 128. A row due later raises a weapon already held below its XP, which keeps its entry and id.

| Weapon          | Chapter 8 | Chapter 9 | Chapter 10 |
| --------------- | --------- | --------- | ---------- |
| `WEP_PL1900_A0` | 790, 2    |           | 1740, 3    |
| `WEP_NP0300_01` | 1140, 2   | 1740, 2   | 2740, 3    |

XP and uncap per row. The game adds `WEP_PL1900_A0` itself after the Chapter 7 start loads, so neither is due earlier.

The game sets 2815 bit 0 on the in-play `_03` as `TUTORIAL_EQUIP` opens. `disableHints` marks that hint shown, so the fill writes the bit itself.

### Outfits

A captain given the `_03` also takes what `ChangeCharacterSkin` and `GetRelinkSword` do across that change: 1302 moves from 1 to 0, and 1316 sets bit 0 and clears bit 1. 1302 stays when it holds another outfit, and other 1316 bits stay.

## `PL1900`

The write follows the `IdoEntry` step of `00109001`, see [`characters.md`](../characters.md). 1305 takes bits 0 and 3. The level is the highest level among the joined characters, capped at 42, and applies only when it is above the unit's own level, with 1303, 1308, 1309 and 1310 from these rows:

| Level | XP     | Base HP | Base attack |
| ----- | ------ | ------- | ----------- |
| 36    | 172152 | 1078    | 141         |
| 37    | 184474 | 1107    | 145         |
| 38    | 196869 | 1136    | 149         |
| 39    | 209309 | 1166    | 153         |
| 40    | 222310 | 1195    | 157         |
| 41    | 235348 | 1224    | 161         |
| 42    | 248461 | 1254    | 165         |

A new save holds the unit at level 37, so a low-level crew leaves it there.

When 1305 bit 3 was unset, meaning the save never played the character, the fill also writes what the story stretch of `00107001` sets: 1404 to `AB_PL1900_01`, `_05`, `_02`, `_07`, 3904 bit 0 on `AB_PL1900_02`, `_05`, `_07`, `_08`, 1602 at offsets 0-42 and 108-134 of the mastery block, and 5815 at 714 to 1.

## Not filled

- `ITEM_70_0008` Dehg's Catalyst Stone, given and taken within Chapter 7.
- `ITEM_70_0001` and `ITEM_70_0003`, which a new save already holds.
- `ITEM_23_0000` Crewmate Cards. The traced run gains three, and a loaded save gains one with the quest rank reward, so the count the game adds by itself is not settled.
- 5815 at 184, 185 and 998, the weapon counts behind badges 360-368 and 1360-1362. They rise with no weapon unit moving when `PL1900` joins, and 998 can fall, so the game takes them again from the weapons held. A load does not.
- The story party, 2201 at 103000-103003.
- Short stories `00720005`-`00720017`. They play voice lines at the quest counter, and their type 3 conditions close them on a save past `0010A025`.
- `00730045`. The game clears it at a record write after a load.
- `BlacksmithPendulumGrant`, 7103 and 6801. The first wrightstone a save receives unlocks the option, and the flipped quests give none.
- MSP for levels `PL1900` gains at the join, side trophies, XP, rupies, consumables, sigils and journal rows.

## Status

Applied to a new save with `advanceStory` to key 220 and `disableHints`, the fill loads in game. The weapons, 2600, the archives and 5815 at 46 and 47 hold after a save, and 46 and 47 reach 7 at note 02, as in the traced run. A save with the outfit writes also loads in game. At key 222 the game pays the trophy 25 reward, and the objective moves to "Progress through Maniac quests".
