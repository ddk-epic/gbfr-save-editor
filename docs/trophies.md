# Trophies

Trophies are two bool arrays at entity 0, indexed by `badge.Key`, and a progress array indexed by `badge.BehaviorId`.

## The trophy arrays

| Attribute | Name                                | Type         | Holds                                                              |
| --------- | ----------------------------------- | ------------ | ------------------------------------------------------------------ |
| 5801      | `TROPHY_EARNED`                     | `bool[1700]` | Earned                                                             |
| 5816      | `TROPHY_SEEN`                       | `bool[1700]` | The earned trophy's new mark is cleared                            |
| 5815      | `TROPHY_PROGRESS`                   | `long[1200]` | Progress toward `badge.ReqQuantity`, indexed by `badge.BehaviorId` |
| 5802      | `TROPHY_CHARACTER_LEVEL`            | `int[28]`    | A character's level, 0 until its first level-up is counted         |
| 5803      | `TROPHY_CHARACTER_MASTERY_UPGRADES` | `int[28]`    | A character's mastery upgrades, indexed as 5802                    |

- An entry whose index is no `badge.Key` stays false.
- 5816 is only ever true on an earned trophy.
- Trophies sharing a `BehaviorId` share one 5815 entry, such as the tiers of one count. An action that counts toward a trophy adds 1 to its entry: completing a fate episode to its character's entry (42 for `PL1500`), applying a wrightstone to 195, an Over Mastery roll to its character's entry for that tier (396-398 for `PL0600`). 14-19, for badges 26-31 "Complete all ... quests", count quest counter clears by difficulty digit 1 to 6, rising at quest end; only first clears have been seen. `ReqQuantity` is not always the row count in 2570: badge 30 needs 15 of 16 `00405` rows, and badge 31 needs 26 of 27 `00406` rows, one untitled. 238, for badge 543 "Complete all Proud quests", counts `00407` clears the same way, from `00407101`, the first Proud quest; the badge needs 20 of 26 rows.
- Some entries are recounts instead, set to a count the game takes again and able to go down. 1015, for badges 1368 and 1370, is the number of crewmates with a power rating of at least 45,000; a weapon switch that takes a character below it lowers it by 1. 998, for badge 1362 "Obtain all weapons", also goes down, on gaining `WEP_PL1900_A0` and not on gaining `WEP_NP0300_01`; what it counts has not been settled. 217, for "Have 5 crewmates reach an individual power rating of 5,000", counts up and back as a story fight's weapon lifts a character past it, while 216, the best power rating, keeps its value. 185, the combined weapon level, jumps when the game raises a weapon. 149, for `PL1900`'s level badges, holds its level, and 219, the combined crew level, adds it. 1028, for badge 1435 "Raise a character to level 100", holds the level of the character last raised, so it can fall.
- 501, for badge 693 "Master of Relink", counts the earned trophies outside Keys 1395-1453. 1018 counts those inside that range.
- 2, for badge 12, counts the chapter keys cleared. A quest named by `chapter_select.QuestId` adds to it, one per key it holds, at its end. `00108001`, named by no key, also adds 1, which brings it level with the length of 2590 at the end of the main story: 38, the `ReqQuantity` of badge 11. Badge 12 needs 41, which fits keys 220-222 being added.
- 377 and 378 hold `PL1900`'s Offense and Defense Mastery percentages. 380 counts mastery upgrades across characters, and 5803 per character. A character's upgrades are the set bits of the low byte of its 1602 masks.
- `PL1900`'s mastery fill counts only when 1305 bit 0 returns on it early in `00109001`. 184, 185 and 998 rise in the same poll with no weapon unit moving, which fits counts that take in the weapons of joined characters. One case.
- A trophy's name and description are `TXT_BADGE_NAME_<Key>` and `TXT_BADGE_EXPL_<Key>` in `text_badge.msg`. A `{0}` in the description is `badge.ReqQuantity`.

## Tabs

The journal lists base game and Endless Ragnarok trophies apart, by `badge.IsEndlessRagnarok`, in tabs that are contiguous `SortOrder` blocks.

| Tab            | Base `SortOrder` | DLC `SortOrder` |
| -------------- | ---------------- | --------------- |
| Story & Quests | 0-133            | 819-875         |
| Character      | 134-353          | 876-1159        |
| Battle         | 354-513          | 1160-1206       |
| Gear           | 514-644          | 1207-1427       |
| Conflux        |                  | 1428-1533       |
| Summons        |                  | 1534-1567       |
| Other          | 645-818          | 1568-1615       |

- The game hides an unearned trophy until the one before it in its chain is earned. The save does not store the chains, and no `badge` column names the trophy that unhides another.
- `badge.NoteCategory`, `BattleFilterId`, `GearFilterId` and `OtherFilterId` are filter groups, not tabs.

## Open

- 5814 at entity 0 holds 1,700 bools, true only on earned trophies. No meaning is assigned.
- 5817 holds 28 bools, and 5818-5820 and 5822 one bool each. None has a meaning assigned.
- 5802's indexes are not the character index: `PL1900` sits at 16 whether its unit is at 10021 or 10023. The rest of the order has not been settled.
- 5821 holds 54 bools. Its indexes follow `badge.Unk2`, which runs from 0 at Key 1394 ("Obtain all trophies", `BehaviorId` 1018) past the array's end, 53 being Key 1447. The Steam achievements at `DAT_147c491b0` `+0xa0` are a candidate source: `FUN_140380c10` fills that array from Steam (`FUN_140896790`, `Hw::cAchievementDeviceSteam`, ids as `{:04d}`), and `FUN_140896560` unlocks an achievement and sets its byte. All 54 can read true on an account without every achievement, Key 1394 among them, which speaks against that source. The registration offset of 5821 has not been confirmed. An entry is true only once its `badge.QuestId` has cleared or when that id is empty, and turns true in batches some time after the clear or in its write, as entries 2, 4, 9 and 27 do for `0010A031`. An entry can be true while its trophy is unearned in 5801, and can turn true after its trophy is earned, as 16 does for Key 1410.
- Trophies in that Key range can be earned while their 5815 entry is below `ReqQuantity`, and with the action never done on the save. They likely come from the Steam account's achievements: a new save on an account that holds them earns them some time after their `badge.QuestId` clears. 5815 at 1018 counts the earned ones. The code that sets 5801 for them has not been found.
- A story chapter's trophies, such as 6 and 1410, can arrive well after their `badge.QuestId` clears, with the game already on a later chapter, and at the first checkpoint after a load for Chapters 7, 8 and 9. A load is not needed: the Final Chapter's arrive at the first checkpoint 9 s after `00108001` clears. A checkpoint alone is not enough either, since one passes after `00105f01` clears without 7 and 1411. 7352 sets on information quests in the same poll or the next, and 5821 with them, which fits one deferred pass. What they wait on has not been settled, and it is not a save alone.
- 5807 and 5808 are 28 bools, one per character, set by Over Mastery rolls, see `masteries.md`.
