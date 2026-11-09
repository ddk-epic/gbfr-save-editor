# Summons

A summon is one unit in the summon list. Its trait and equip bonus live on the unit itself, with no trait list.

## The summon unit

Summons occupy 1000 entities, `SUMMON_FIRST` (0) to 999. Every save has all 1000 units, a new game included. A summon id of 0 marks an empty entry.

| Attribute | Name                     | Type      | Holds                                                                |
| --------- | ------------------------ | --------- | -------------------------------------------------------------------- |
| 1456      | `SUMMON_ID`              | `uint`    | Summon id the summon slots reference                                 |
| 1457      | `SUMMON_KEY`             | `uint`    | `summon.Key` hash                                                    |
| 1458      | `SUMMON_TRAIT_AND_BONUS` | `uint[2]` | `skill.Key` of the trait, `summon_base_param.Key` of the equip bonus |
| 1459      | `SUMMON_LEVELS`          | `int[2]`  | Trait level, equip bonus level                                       |
| 1460      | `SUMMON_FLAGS`           | `uint`    | Flags                                                                |

- An empty unit holds the empty hash in 1457 and in both 1458 values, -1 in both 1459 values, and flags 0.
- Summons in use fill the list from unit 0 with no gaps.
- Summon ids are unique. They are not dense: the highest is far above the number of summons.
- Every summon has a key that resolves in `summon`, a trait and an equip bonus.
- An equip bonus's value is its `summon_base_param` `Level<level + 1>Value` times `ValueDisplayMultiplier`, 10 on Stun Power and 1 on the rest.

## Other units

The summon list shares its attribute range with these units:

| Attribute | Entities | Name               | Type      | Holds                                                                                               |
| --------- | -------- | ------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| 1451      | 0        | `SUMMONS_EQUIPPED` | `uint[4]` | Summon ids of the four slots, 0 when empty                                                          |
| 1452      | 0-299    | `SUMMONS_KEY`      | `uint`    | `summon.Key` of every `summon` row in table order at units 0-188, the empty hash at 189-299         |
| 1453      | 0-299    | `SUMMONS_OBTAINED` | `uint`    | Probably whether the 1452 summon was ever obtained: 0 or 1, 1 only where 1452 is not the empty hash |
| 1454      | 0        | `SUMMON_LAST_ID`   | `uint`    | The highest summon id in use, 0 when none                                                           |
| 1455      | 0        | `SUMMONS_UNLOCKED` | `uint`    | Probably summon access, 0 or 1                                                                      |

Every non-zero id in 1451 belongs to a held summon. The slots are shared by the party.

1455 is 1 in a save with access to summons and 0 otherwise. The first summon, `su_So4900_TU` from `0010B001`, takes it 0 to 1 with 1453 at its row and 1454 to 1.

The story gives three fixed summons. Each one's `summon_lot` rows hold a single trait and a single bonus at weight 10000, and none of them is in `reward_summon_lot` or `summon_preset`:

| Key            | Hash       | Name         | Given by                                                                     | Trait          | Bonus      |
| -------------- | ---------- | ------------ | ---------------------------------------------------------------------------- | -------------- | ---------- |
| `su_So4900_TU` | `7996A856` | Furycane I   | `AddSummonStone` in `0010B001`, equipped at once                             | `SKILL_013_00` | `00D171E0` |
| `su_So3300_TU` | `CC3C45F3` | Rock Golem I | `AddSummonStone` in `0010B002`                                               | `SKILL_068_00` | `2270BC40` |
| `su_So4b00_TU` | `23D839A3` | Managarmr I  | Tutorial action step `0x10` (`FUN_140a79020`), which also re-equips Furycane | `SKILL_069_00` | `F7B0316F` |

- `summon` has 189 rows, one per summon. 1452 lists all of them in every save, a new game included.
- Every held summon key has a 1 in 1453, and so do keys never held. 1453 does not mark held summons.
- A save with only part of the summons obtained is needed to confirm 1453.

## Flags

1460 uses bits 0 and 1.

| Bit | Value | Name                   | Set on                            |
| --- | ----- | ---------------------- | --------------------------------- |
| 0   | 1     | `SUMMON_EVER_EQUIPPED` | Summons equipped at least once    |
| 1   | 2     | `SUMMON_SEEN`          | Summons whose new mark is cleared |

- Every summon with bit 0 has bit 1.
- Every summon in 1451 has both bits.
