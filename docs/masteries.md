# Masteries

A character's mastery block holds its Over Masteries, mastery nodes and master trait cells.

## The mastery block

A character's mastery block sits at `MASTERY_FIRST` (10000000) + character index \* 1000 + entry, 400 entities wide. Mastery nodes and master trait cells both use attributes 1601 and 1602, told apart by the table that holds the 1601 hash. 1601 and 1602 at entities 0-199 hold the Resonance tree.

## Over Masteries

A character holds four Over Mastery stats at entries 0-3 of its mastery block. Each character has its own seed per roll tier, which decides its next roll.

| Attribute | Name                      | Type        | Entity      | Holds                                                                |
| --------- | ------------------------- | ----------- | ----------- | -------------------------------------------------------------------- |
| 1606      | `OVER_MASTERY_KEY`        | `uint`      | Entries 0-3 | `limit_bonus_param.Key` of a `MED_EFF_*` stat, empty hash when empty |
| 1607      | `OVER_MASTERY_LEVEL`      | `int`       | Entries 0-3 | Roll level as one bit, level n is `1 << (n-1)`, 0 when empty         |
| 5807      | `OVER_MASTERY_ROLLED`     | `bool[28]`  | 0           | Per character slot, set by its first roll of any tier                |
| 5808      | `OVER_MASTERY_LV3_ROLLED` | `bool[28]`  | 0           | Per character slot, set by its first Lv 3 roll                       |
| 7601      | `RANDOM_SEEDS`            | `uint[131]` | 0           | Seeds, the Over Mastery ones among them, see below                   |

A roll is Over Master Lv 1, 2 or 3 and writes all four entries. Each tier costs its own MSP (1112) and advances the character's seed for that tier:

| Tier | MSP   | Seed, 7601 index | Trophy, `badge.Unk9` | Flags set  |
| ---- | ----- | ---------------- | -------------------- | ---------- |
| Lv 1 | 700   | 11 for `PL0600`  | 13                   | 5807       |
| Lv 2 | 1,000 | 52 for `PL0600`  | 14                   | 5807       |
| Lv 3 | 2,000 | 93 for `PL0600`  | 15                   | 5807, 5808 |

- The tier seeds sit 41 apart, one block of 41 per tier. `PL0700`'s Lv 3 seed is at 96 and `PL1900`'s Lv 1 seed at 31. The order of characters within a block is not settled. Index 0 moves at saves and quest ends and is not an Over Mastery seed.
- A stat's value is its `limit_bonus_param` `Lv<level>Value`, times 10 for Stun Power (`DisplayNumberMultiplier` 3).
- Two Lv 3 rolls from the same seed give the same four stats and levels. Running a quest also advances the seeds.
- Removing an Over Mastery is the empty hash at 1606 and 0 at 1607 on all four entries. The game loads the character as unrolled and rolls it again.

### Roll bookkeeping

After a roll the game updates the trophy units for the character and tier. `PL0100` counts as `PL0000`, and `PL2000` as `PL1900`.

- 5815 at the `BehaviorId` of the `badge` row with the character's `CharaId` and the tier's `Unk9` goes up by 1, such as 396-398 for `PL0600` and 399-401 for `PL0700`.
- The character's 5807 slot is set to true. 5815 index 221, the crewmate count of "Mastery Breaker" and its tiers, is then set to the number of true 5807 slots.
- On a Lv 3 roll, the same for 5808 and 5815 index 222, the count of "Overpowered".
- 221 and 222 are recounts, so a roll on a character whose slot is already true leaves them as they are. Removal leaves the slots true and the character counted.

5807 and 5808 slots by character:

| Slot | Character         | Slot | Character | Slot | Character         | Slot | Character |
| ---- | ----------------- | ---- | --------- | ---- | ----------------- | ---- | --------- |
| 0    | `PL0000` `PL0100` | 7    | `PL0800`  | 14   | `PL1500`          | 21   | `PL2100`  |
| 1    | `PL0200`          | 8    | `PL0900`  | 15   | `PL1800`          | 22   | `PL2400`  |
| 2    | `PL0300`          | 9    | `PL1000`  | 16   | `PL1900` `PL2000` | 23   | `PL2500`  |
| 3    | `PL0400`          | 10   | `PL1100`  | 17   | `PL1600`          | 24   | `PL2600`  |
| 4    | `PL0500`          | 11   | `PL1200`  | 18   | `PL1700`          | 25   | `PL2700`  |
| 5    | `PL0600`          | 12   | `PL1300`  | 19   | `PL2200`          | 26   | `PL2800`  |
| 6    | `PL0700`          | 13   | `PL1400`  | 20   | `PL2300`          | 27   | `PL2900`  |

`limit_bonus_meditation_category` holds each tier's stat pool, `MeditationWeightId` 0-2 for Lv 1-3, every entry at weight 1:

| Tier       | Pool                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Lv 1       | 23 entries: ATK and HP 5 each, Critical Hit Rate and Stun Power 3 each, the other seven 1 each |
| Lv 2, Lv 3 | The 11 base `MED_EFF_*` keys, 1 each                                                           |

- The extra Lv 1 entries are the `_02`-`_05` keys, copies of their base key with the same text and values.
- Every tier rolls four entries: `limit_bonus_meditation` `NumMasteries1` is 4 at weight 100, `NumMasteries2` and `NumMasteries3` at weight 0.
- A roll draws four different keys from its pool. Lv 2 and Lv 3 rolls give four different stats. A Lv 1 roll can give the same stat on more than one entry, as a base key and its copies.

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
