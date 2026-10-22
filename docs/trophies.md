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
- Trophies sharing a `BehaviorId` share one 5815 entry, such as the tiers of one count. An action that counts toward a trophy adds 1 to its entry: completing a fate episode to its character's entry (42 for `PL1500`), applying a wrightstone to 195, an Over Mastery roll to 396-398 by tier.
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
- 5802 and 5803 hold 28 ints, 5807, 5808 and 5817 hold 28 bools, 5821 holds 54 bools, and 5818-5820 and 5822 one bool each. None has a meaning assigned. An Over Mastery roll sets 5807 at index 5, and a Lv 3 roll also 5808 at index 5, see `masteries.md`.
