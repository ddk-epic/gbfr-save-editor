# Masteries

A character's mastery block holds its Over Masteries, mastery nodes and master trait cells.

## The mastery block

A character's mastery block sits at `MASTERY_FIRST` (10000000) + character index \* 1000 + entry, 400 entities wide. Mastery nodes and master trait cells both use attributes 1601 and 1602, told apart by the table that holds the 1601 hash. 1601 and 1602 at entities 0-199 hold the Resonance tree.

## Over Masteries

A character holds four Over Mastery stats at entries 0-3 of its mastery block. Each roll tier has its own seed, shared by all characters, that decides its next roll.

| Attribute | Name                 | Type        | Entity      | Holds                                                                |
| --------- | -------------------- | ----------- | ----------- | -------------------------------------------------------------------- |
| 1606      | `OVER_MASTERY_KEY`   | `uint`      | Entries 0-3 | `limit_bonus_param.Key` of a `MED_EFF_*` stat, empty hash when empty |
| 1607      | `OVER_MASTERY_LEVEL` | `int`       | Entries 0-3 | Roll level as one bit, level n is `1 << (n-1)`, 0 when empty         |
| 7601      | not named            | `uint[131]` | 0           | Over Mastery seeds by tier, see below                                |

A roll is Over Master Lv 1, 2 or 3 and writes all four entries. Each tier costs its own MSP (1112) and writes its own units at entity 0:

| Tier | MSP   | Seed, 7601 index | Roll count, 5815 index | Flags set       |
| ---- | ----- | ---------------- | ---------------------- | --------------- |
| Lv 1 | 700   | 11               | 396                    | 5807 at 5       |
| Lv 2 | 1,000 | 52               | 397                    | 5807 at 5       |
| Lv 3 | 2,000 | 93               | 398                    | 5807, 5808 at 5 |

- Two Lv 3 rolls from the same seed give the same four stats and levels. Running a quest also advances the seeds.
- Removing an Over Mastery is the empty hash at 1606 and 0 at 1607 on all four entries. The game loads the character as unrolled and rolls it again.
- A roll sets its flags back to true when they are false, so removal can leave them as they are. 5807 and 5808 have no meaning assigned.

## Mastery nodes

The entries start with the character's mastery nodes: every `LimitBonusId` of its `ap_tree_atk`, `ap_tree_def`, `ap_tree_wep` and `ap_tree_rebuild` rows.

| Attribute | Name                | Type   | Holds                    |
| --------- | ------------------- | ------ | ------------------------ |
| 1601      | `MASTERY_NODE_KEY`  | `uint` | Node `LimitBonusId`      |
| 1602      | `MASTERY_NODE_BITS` | `int`  | Bitmask of the node rows |

| Bits  | Holds                                                        |
| ----- | ------------------------------------------------------------ |
| 0-7   | Bit n set when the node at `LimitBonusParamIndex` n is taken |
| 8-15  | A subset of bits 0-7, likely nodes granted on joining        |
| 16-31 | Always 0                                                     |

- The extension is the Offense and Defense rows at `DiffSeparatorMaybe` 311 and up.
- Transcendence counts the `ap_tree_rebuild` rows at `ReqWepTranscensionLevel` 7 only. A bought transcendence node is a bit on its T7 row; the weapon's own stage (`WEAPON_TRANSCENDENCE`) unlocks the nodes and sets none. The T1-6 rows are never set.

## Weapon series

Every Collection and Transcendence row names a weapon in `WeaponId`, and that weapon's `weapon.Unk30` is the node's series. `MASTERY_NODES` carries it as a fourth cell element, `MasteryNode.series` reads it, and `MasteryProgress.bySeries` counts taken, total and MSP per series.

- The series belongs to the node, not the ladder. One `LimitBonusId` can hold nodes of several series, such as bits 0-1 on a Defender, 2-3 on an Executioner and 4-5 on a Stinger.
- `WeaponId` is often a variant key, such as `WEP_PL0000_01_01` or `WEP_PL0000_06_03`, not the key of the weapon held. Its series is the same.
- A series holds 6 Collection nodes and 6 T7 Transcendence nodes.
- PL2100-PL2500, PL2800 and PL2900 have no Stunner (1) or Executioner (5) in the Collection, so 4 series.
