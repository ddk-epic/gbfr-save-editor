# Trophies

Trophies are two bool arrays at entity 0, indexed by `badge.Key`.

## The trophy arrays

| Attribute | Name            | Type         | Holds                                   |
| --------- | --------------- | ------------ | --------------------------------------- |
| 5801      | `TROPHY_EARNED` | `bool[1700]` | Earned                                  |
| 5816      | `TROPHY_SEEN`   | `bool[1700]` | The earned trophy's new mark is cleared |

- An entry whose index is no `badge.Key` stays false.
- 5816 is only ever true on an earned trophy.
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

- 5815 at entity 0 holds 1,200 longs. Indexed by `badge.BehaviorId`, it likely holds the progress toward a trophy's `ReqQuantity`.
- 5814 at entity 0 holds 1,700 bools, true only on earned trophies. No meaning is assigned.
- 5802 and 5803 hold 28 ints, 5807, 5808 and 5817 hold 28 bools, 5821 holds 54 bools, and 5818-5820 and 5822 one bool each. None has a meaning assigned.
