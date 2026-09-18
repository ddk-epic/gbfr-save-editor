# Summons

A summon is one unit in the summon list. Its trait and equip bonus live on the unit itself, with no trait list. `readSummons` in `src/domain/inventory.ts` reads it. The layout facts hold in every local save tested, from a new game to endgame. Of those saves, only SaveData1 holds summons, so the facts about filled units rest on that save alone.

## The summon unit

Summons occupy 1000 entities, `UNIT.SUMMON` (0) to 999. Every save has all 1000 units, a new game included. A summon id of 0 marks an empty entry.

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

## Other units

The summon list shares its attribute range with these units:

| Attribute | Entities | Name               | Type      | Holds                                                                                               |
| --------- | -------- | ------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| 1451      | 0        | `SUMMONS_EQUIPPED` | `uint[4]` | Summon ids of the four slots, 0 when empty                                                          |
| 1452      | 0-299    | `SUMMONS_KEY`      | `uint`    | `summon.Key` of every `summon` row in table order at units 0-188, the empty hash at 189-299         |
| 1453      | 0-299    | `SUMMONS_OBTAINED` | `uint`    | Probably whether the 1452 summon was ever obtained: 0 or 1, 1 only where 1452 is not the empty hash |
| 1454      | 0        | `SUMMON_LAST_ID`   | `uint`    | The highest summon id in use, 0 when none                                                           |
| 1455      | 0        | not named          | `uint`    | Probably summon access, 0 or 1                                                                      |

Every non-zero id in 1451 belongs to a held summon. The slots are shared by the party.

1455 is 1 in SaveData1, the only save with access to summons, and 0 in the others.

- `summon` has 189 rows, one per summon. 1452 lists all of them in every save, a new game included.
- 1453 has 159 ones in SaveData1 and none in the other saves. SaveData1 holds 181 summons of 55 keys, and every held key has a 1. 1453 does not mark held summons.
- A save with only part of the summons obtained is needed to confirm 1453.

## Flags

1460 uses bits 0 and 1.

| Bit | Value | Name                   | Set on                            |
| --- | ----- | ---------------------- | --------------------------------- |
| 0   | 1     | `SUMMON_EVER_EQUIPPED` | Summons equipped at least once    |
| 1   | 2     | `SUMMON_SEEN`          | Summons whose new mark is cleared |

- Every summon with bit 0 has bit 1.
- Every summon in 1451 has both bits.
