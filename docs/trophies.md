# Trophies

Trophies are two bool arrays at entity 0, indexed by `badge.Key`, and a progress array indexed by `badge.BehaviorId`.

## The trophy arrays

| Attribute | Name              | Type         | Holds                                                              |
| --------- | ----------------- | ------------ | ------------------------------------------------------------------ |
| 5801      | `TROPHY_EARNED`   | `bool[1700]` | Earned                                                             |
| 5816      | `TROPHY_SEEN`     | `bool[1700]` | The earned trophy's new mark is cleared                            |
| 5815      | `TROPHY_PROGRESS` | `long[1200]` | Progress toward `badge.ReqQuantity`, indexed by `badge.BehaviorId` |

- An entry whose index is no `badge.Key` stays false.
- 5816 is only ever true on an earned trophy.
- Trophies sharing a `BehaviorId` share one 5815 entry, such as the tiers of one count. An action that counts toward a trophy adds 1 to its entry: completing a fate episode to its character's entry (42 for `PL1500`), applying a wrightstone to 195, an Over Mastery roll to its character's entry for that tier (396-398 for `PL0600`).
- Some entries are recounts instead, set to a count the game takes again and able to go down. 1015, for badges 1368 and 1370, is the number of crewmates with a power rating of at least 45,000; a weapon switch that takes a character below it lowers it by 1. 998, for badge 1362 "Obtain all weapons", also goes down, on gaining `WEP_PL1900_A0` and not on gaining `WEP_NP0300_01`; what it counts has not been settled. 217, for "Have 5 crewmates reach an individual power rating of 5,000", counts up and back as a story fight's weapon lifts a character past it, while 216, the best power rating, keeps its value. 185, the combined weapon level, jumps when the game raises a weapon.
- 501, for badge 693 "Master of Relink", counts the earned trophies outside Keys 1395-1453. 1018 counts those inside that range.
- 2, for badge 12, counts the chapter keys cleared. Only a quest named by `chapter_select.QuestId` adds to it, one per key it holds, at its end.
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
- 5802 and 5803 hold 28 ints, 5817 holds 28 bools, and 5818-5820 and 5822 one bool each. None has a meaning assigned.
- 5821 holds 54 bools. Its indexes follow `badge.Unk2`, which runs from 0 at Key 1394 ("Obtain all trophies", `BehaviorId` 1018) past the array's end, 53 being Key 1447. It is likely the copy of the Steam achievements at `DAT_147c491b0` `+0xa0`: `FUN_140380c10` fills that array from Steam (`FUN_140896790`, `Hw::cAchievementDeviceSteam`, ids as `{:04d}`), and `FUN_140896560` unlocks an achievement and sets its byte. The registration offset of 5821 has not been confirmed. An entry is true only once its `badge.QuestId` has cleared or when that id is empty, and turns true in batches some time after the clear. An entry can be true while its trophy is unearned in 5801, and can turn true after its trophy is earned, as 16 does for Key 1410.
- Trophies in that Key range can be earned while their 5815 entry is below `ReqQuantity`, and with the action never done on the save. They likely come from the Steam account's achievements: a new save on an account that holds them earns them some time after their `badge.QuestId` clears. 5815 at 1018 counts the earned ones. The code that sets 5801 for them has not been found.
- A story chapter's trophies, such as 6 and 1410, can arrive well after their `badge.QuestId` clears, with the game already on a later chapter, and often at a checkpoint after a load. 7352 sets on information quests in the same poll, which fits one deferred pass. What they wait on has not been settled, and it is not a save alone.
- 5807 and 5808 are 28 bools, one per character, set by Over Mastery rolls, see `masteries.md`.
