# Story fill

`fillSkippedStory` adds what the chapters up to the save's current chapter should have left, for a save moved forward by `advanceStory`. It runs after the chapters, like `disableHints`. It reads `CURRENT_CHAPTER` (2506) and takes every row with a key at or below it. Each row checks the save first, so a played save, or a second run, changes nothing it already holds.

| Due by     | Key | Trophies | Items                                 | Archives                                                           | UI features | Other                                          |
| ---------- | --- | -------- | ------------------------------------- | ------------------------------------------------------------------ | ----------- | ---------------------------------------------- |
| Chapter 2  | 40  | 1, 1405  |                                       |                                                                    | 7           |                                                |
| Chapter 3  | 60  | 2, 1406  | `ITEM_70_0004` Rolan's Transceiver    |                                                                    |             |                                                |
| Chapter 4  | 80  | 3, 1407  | `ITEM_70_0005` Rebelwear              | `ARC_OTHER_011`                                                    |             | `WEP_PL0000_03`, `WEP_PL0100_03` replace `_01` |
| Chapter 5  | 100 | 4, 1408  |                                       |                                                                    |             |                                                |
| Chapter 6  | 120 | 5, 1409  |                                       |                                                                    |             |                                                |
| Chapter 7  | 140 | 6, 1410  |                                       |                                                                    |             |                                                |
| Chapter 8  | 160 | 7, 1411  | `ITEM_70_0006` Elpis, the Mind Sealer | `ARC_OTHER_026`, `ARC_OTHER_058`, `ARC_OTHER_059`, `ARC_OTHER_060` |             |                                                |
| Chapter 9  | 180 | 8, 1412  |                                       |                                                                    |             | `WEP_PL0000_99`, `WEP_PL0100_99`               |
| Chapter 10 | 200 | 9, 1413  | `ITEM_70_0010` Rolan's Notes          | `ARC_ROLANNOTE_08`                                                 |             |                                                |
| Chapter Ø  | 220 | 11, 1397 |                                       |                                                                    | 0-6         | `PL1900` joins                                 |

## Checks and writes

| Kind       | Holds it when             | Writes                                                                                |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------- |
| Trophy     | 5801 at the key is true   | 5801, and adds 1 to 5815 at 501, or at 1018 for Keys 1395-1453                        |
| Item       | 1804 is not 0             | 1802 to 1, 1803 to 4, or 36 on `ITEM_70_0010`, 1804 to the next 1805, and 1805        |
| Archive    | 7902 bit 0 is set         | 7902 to bit 0, or bits 0 and 1 on `ARC_ROLANNOTE_08`, and adds 1 to 5815 at 46 and 47 |
| UI feature | 2600 at the index is true | 2600 at the index to true                                                             |
| Weapon     | 7403 at its row is not 0  | The first free weapon entry, see below                                                |
| `PL1900`   | 1305 bit 0 is set         | See below                                                                             |

- 2600 holds one bool per `UnlockUIAction.feature_`, see [`quests.md`](../quests.md).
- 1804 stays set once an item is spent, so a story item used up later is not added again.
- 5815 at 2 takes the row's chapter key count and only rises: 4, 6, 9, 13, 18, 22, 26, 30, 36, 38.

## Weapons

Each added weapon takes the first free entry: 2802 the next 2801, 2803, 2804, 2805 and 2815, with 7403 at its row to 4, and 2801. 7403 stays set when a weapon is later sold, so a weapon sold on a played save is not added again.

| Weapon               | XP     | Uncap | Flags (2815)                                 | Also                                                                                                        |
| -------------------- | ------ | ----- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `_03`, due Chapter 4 | 90     | 0     | 129 on the captain in play, 128 on the other | Clears the captain's `_01` entry. 1402 takes the new id on a captain equipping the `_01`. See outfits below |
| `_99`, due Chapter 9 | 162540 | 6     | 128                                          | 1402 on the captain not in play takes it. The captain in play's `_03` takes XP 1740, uncap 3                |

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
- MSP for levels `PL1900` gains at the join, side trophies, XP, rupies, consumables, sigils and journal rows.

## Status

Applied to a new save with `advanceStory` to key 220 and `disableHints`, the fill loads in game. The weapons, 2600, the archives and 5815 at 46 and 47 hold after a save, and 46 and 47 reach 7 at note 02, as in the traced run. A save with the outfit writes also loads in game.
