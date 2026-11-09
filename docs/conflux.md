# Conflux

Conflux is the endless mode added in the Endless Ragnarok DLC. The save holds its Resonance tree, its aura collection, the state of a run and a few unnamed state values. The tables behind it are the `endlessmode_*` tables of the archive.

## Resonance points

`RESONANCE_POINTS` (1116) at entity 0 holds the Resonance points, the currency of the Resonance tree.

## Resonance tree

The Resonance tree uses attributes 1601 and 1602, as masteries and master traits do in the mastery block, and is stored the same way as masteries. It sits at entities 0-199.

| Attribute | Name             | Type   | Holds                                       |
| --------- | ---------------- | ------ | ------------------------------------------- |
| 1601      | `RESONANCE_KEY`  | `uint` | Bonus of the node, a `limit_bonus.Key` hash |
| 1602      | `RESONANCE_BITS` | `int`  | Bitmask of the taken nodes with that bonus  |

- `endlessmode_tree` has 62 rows, one per node. Several nodes can grant the same bonus, so the save holds 58 entries at units 0-57, one per distinct `endlessmode_tree.Unk19`, in the order each first appears in the table. Units 58-199 hold the empty hash and 0.
- Every save has all 58 entries, a new game included.
- Bit n of 1602 is the node with that bonus at `endlessmode_tree.Unk24` n, as `LimitBonusParamIndex` works for masteries.
- The game's tree completion probably counts only the first 42 rows. The other 20 rows carry `Unk35` 151.

### `endlessmode_tree` columns

`endlessmode_tree` columns keep the extractor's names.

| Column        | Holds                                          |
| ------------- | ---------------------------------------------- |
| `Unk1`-`Unk3` | Parent node ids, empty on the root             |
| `Unk19`       | Bonus, a `limit_bonus.Key`                     |
| `Unk20`       | Node id                                        |
| `Unk24`       | Index among the nodes with the same bonus, 0-2 |
| `Unk25`       | Cost in Resonance points                       |
| `Unk30`       | Position                                       |
| `Unk35`       | 0 or 151                                       |

A bonus's name and description are the text keys `limit_bonus.NodeTitle` and `limit_bonus.NodeDescription`, `TXT_EDL_*`.

## Aura collection

Auras occupy 300 entities, 0 to 299. Every save holds all 236 `endlessmode_buff` rows at units 0-235, a new game included, but not in table order. Units 236-299 hold the empty hash with flags 0.

| Attribute | Name                 | Type   | Holds                          |
| --------- | -------------------- | ------ | ------------------------------ |
| 9601      | `CONFLUX_AURA_KEY`   | `uint` | `endlessmode_buff.Unk105` hash |
| 9602      | `CONFLUX_AURA_FLAGS` | `uint` | Flags                          |

The first digit of `endlessmode_buff.Unk1` is the aura's category, and `endlessmode_buff_category` has one row per category.

| Digit | Category      | Text key                         | Auras |
| ----- | ------------- | -------------------------------- | ----- |
| 0     | Vitality      | `TXT_KKTN_BFCHIC_TYPE_BREATH`    | 30    |
| 1     | Sequestration | `TXT_KKTN_BFCHIC_TYPE_ISOLATION` | 30    |
| 2     | Fortification | `TXT_KKTN_BFCHIC_TYPE_TUTELARY`  | 30    |
| 3     | Dread         | `TXT_KKTN_BFCHIC_TYPE_AWE`       | 30    |
| 4     | Destruction   | `TXT_KKTN_BFCHIC_TYPE_DESTROY`   | 30    |
| 5     | Warfare       | `TXT_KKTN_BFCHIC_TYPE_CONFLICT`  | 30    |
| 6     | Calamity      | `TXT_KKTN_BFCHIC_TYPE_DISASTER`  | 16    |
| 7     | Salvation     | `TXT_KKTN_BFCHIC_TYPE_RESCUE`    | 16    |
| 8     | Chaos         | `TXT_KKTN_BFCHIC_TYPE_CHAOS`     | 24    |

The collection shows the obtained auras over all auras, rounded down, for each category and overall. Calamity and Salvation share one entry.

### Flags

9602 uses bits 0 and 1.

| Bit | Value | Name                    | Set on                          |
| --- | ----- | ----------------------- | ------------------------------- |
| 0   | 1     | `CONFLUX_AURA_OBTAINED` | Obtained auras                  |
| 1   | 2     | `CONFLUX_AURA_SEEN`     | Auras whose new mark is cleared |

Every aura with bit 1 has bit 0.

## Runs

A run's state sits in 2601-2650. Most of it fills during a run and goes back to 0 or empty at the run's end; the per-run arrays keep their values.

| Attribute | Name                    | Type        | Entities | Holds                                                  |
| --------- | ----------------------- | ----------- | -------- | ------------------------------------------------------ |
| 2601      | `CONFLUX_AREA`          | `uint`      | 0        | Current area, a new value at each area                 |
| 2602      | `CONFLUX_RUN_INDEX`     | `int`       | 0        | Index of the run, from 0                               |
| 2607      | `CONFLUX_RUN_SCORE`     | `uint`      | 0        | Score of the current run                               |
| 2608      | `CONFLUX_RUN_STAGES`    | `uint`      | 0        | Stages cleared in the current run                      |
| 2610      | `CONFLUX_CYCLE_CLEARED` | `uint[5]`   | 0        | 1 at the run index once that run is cleared            |
| 2611      | `CONFLUX_CYCLE_SCORE`   | `uint[5]`   | 0        | Score at the run index                                 |
| 2612      | `CONFLUX_RUN_RESONANCE` | `uint[2]`   | 0        | Resonance points earned in the run                     |
| 2615-2618 | `CONFLUX_RUN_REWARDS`   | `uint`      | 0-127    | Reward slots: item key, count and two more values      |
| 2619      | `CONFLUX_RUN_AURAS`     | `uint`      | 0-63     | Aura taken, an `endlessmode_lot.Unk1` key per slot     |
| 2620      | not named               | `bool`      | 0-63     | True where the aura in 2619 was enhanced               |
| 2639      | `CONFLUX_PACKAGE_TAKEN` | `uint[128]` | 0        | 1 at each `endlessmode_package` row taken              |
| 2642      | not named               | `uint[128]` | 0        | 1 at `endlessmode_package` rows turned on at run setup |
| 2649      | `CONFLUX_RETURNED`      | `bool[5]`   | 0        | True at the run index after the run's return to town   |
| 2650      | `CONFLUX_RETURNED_AT`   | `uint[5]`   | 0        | Unix time in seconds of that return                    |

- 2602 is set before a run starts and goes back to 0 at its end. Each cycle has been played once so far, Cycle 5 at index 4, so the run index and the cycle are not told apart.
- At a run's end 2607 goes into 2611 at the run's index, and 2610 at that index goes to 1. Whether 2611 keeps the best score or the last one is not settled.
- 2612 index 1 rises with 2609 through the run, and index 0 takes index 1 at each stage end. `RESONANCE_POINTS` (1116) rises by the last 2612 value at the run's end.
- 2615-2618 fill at the reward pack menu after a stage.
- 2639 is set at the end of every run, for generic and one-time packages alike.
- 2642 turns on as a run is set up, on rows with a quest in `Unk22` and rows without one.
- A run can start from a side quest: 2505 takes the side quest at the run's start, and the side quest's 2553 progress goes to 1 at the run's end. See [Side quests](quests.md#side-quests).
- 2603 counts the areas. 2604 counts the stages, 1 to 3. 2613, 2614 and 2632 grow by one entry per area, 2613 with the 2601 values. 8975-8983 hold the area ids and the foes fought per area.
- 2636 is 1 from the run's setup to its end. 2638 counts up during a run and goes back to 0 at its end. Neither has a meaning assigned.

## Other units

| Attribute | Name      | Type     | Holds                                |
| --------- | --------- | -------- | ------------------------------------ |
| 9501      | not named | `uint`   | Hash-like                            |
| 9502      | not named | `int`    |                                      |
| 9503      | not named | `int`    |                                      |
| 9504      | not named | `int`    |                                      |
| 9505      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9506      | not named | `short`  |                                      |
| 9507      | not named | `ubyte`  |                                      |
| 9508      | not named | `bool`   |                                      |
| 9509      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9510      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9511      | not named | `int[2]` |                                      |

Each has a single unit at entity 0.
