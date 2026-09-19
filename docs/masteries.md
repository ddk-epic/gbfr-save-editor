# Masteries

A character's mastery block holds its over-masteries, mastery nodes and master trait cells.

## The mastery block

A character's mastery block sits at `MASTERY_FIRST` (10000000) + character index \* 1000 + entry, 400 entities wide. 1601 and 1602 at entities 0-199 hold the Resonance tree.

| Attribute | Name                 | Type   | Entries | Holds                                                        |
| --------- | -------------------- | ------ | ------- | ------------------------------------------------------------ |
| 1601      | `UNLOCK_KEY`         | `uint` | 0-399   | Mastery node `LimitBonusId` or `skillboard_effect.Key`       |
| 1602      | `UNLOCK_VALUE`       | `int`  | 0-399   | Node bitmask or master trait selection                       |
| 1606      | `OVER_MASTERY_KEY`   | `uint` | 0-3     | `limit_bonus_param.Key` of a `MED_EFF_*` stat                |
| 1607      | `OVER_MASTERY_LEVEL` | `int`  | 0-3     | Roll level as one bit, level n is `1 << (n-1)`, 0 when empty |

## Mastery nodes

The entries start with the character's mastery nodes: every `LimitBonusId` of its `ap_tree_atk`, `ap_tree_def`, `ap_tree_wep` and `ap_tree_rebuild` rows. 1602 holds a bitmask per node.

| Bits  | Holds                                                        |
| ----- | ------------------------------------------------------------ |
| 0-7   | Bit n set when the node at `LimitBonusParamIndex` n is taken |
| 8-15  | A subset of bits 0-7, likely nodes granted on joining        |
| 16-31 | Always 0                                                     |

- The extension is the Offense and Defense rows at `DiffSeparatorMaybe` 311 and up.
- Transcendence counts the `ap_tree_rebuild` rows at `ReqWepTranscensionLevel` 7 only. The T1-6 rows are never set.
