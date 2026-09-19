# Characters

A character is one unit per `chara` row.

## The character unit

Characters occupy 41 entities, `CHARACTER_FIRST` (10000) to 10040, one per `chara` row. The character index is the entity minus 10000. Every save has all 41 units, a new game included.

| Attribute | Name                          | Type        | Holds                                                        |
| --------- | ----------------------------- | ----------- | ------------------------------------------------------------ |
| 1301      | `CHARACTER_KEY`               | `uint`      | `chara.CharId` hash                                          |
| 1302      | not named                     | `int`       | Always 0                                                     |
| 1303      | `CHARACTER_XP`                | `int`       | XP, 8,400,000 at level 100                                   |
| 1304      | not named                     | `int`       | Always 0                                                     |
| 1305      | `CHARACTER_FLAGS`             | `uint`      | Flags                                                        |
| 1307      | not named                     | `int`       |                                                              |
| 1308      | `CHARACTER_LEVEL`             | `int`       | Level                                                        |
| 1309      | `CHARACTER_BASE_HP`           | `int`       | Base HP, `chara_status.Hp` at the level                      |
| 1310      | `CHARACTER_BASE_ATTACK`       | `int`       | Base ATK, `chara_status.Attack` at the level                 |
| 1311      | not named                     | `int`       | Always 0                                                     |
| 1312      | `CHARACTER_BASE_STUN`         | `float`     | Base Stun Power, `chara_status.Stun`                         |
| 1313      | `CHARACTER_BASE_CRIT`         | `int`       | Base Critical Hit Rate, `chara_status.CritRate`              |
| 1314      | `CHARACTER_QUESTS_USED`       | `uint`      | Number of quests the character was used in                   |
| 1315      | not named                     | `uint`      | Always the empty hash                                        |
| 1316      | not named                     | `uint`      |                                                              |
| 1317      | not named                     | `uint`      |                                                              |
| 1318      | not named                     | `uint`      | Bitmask, up to 6 bits                                        |
| 1321      | not named                     | `uint`      | Possibly the highest single hit, unconfirmed                 |
| 1322      | not named                     | `uint`      | 0 on NPCs, 1 or 3 on playable characters and the `SLOT` rows |
| 1323      | `CHARACTER_MASTER_XP`         | `int`       | MSP spent on master levels                                   |
| 1324      | `CHARACTER_DELEGATE_ENLISTED` | `int`       | Probably the times the character was enlisted as a delegate  |
| 1325      | not named                     | `int`       | Always -1                                                    |
| 1326      | `CHARACTER_DELEGATE_MESSAGE`  | `byte[241]` | Delegate message, padded with 0                              |
| 1402      | `EQUIP_WEAPON`                | `uint`      | Weapon id                                                    |
| 1403      | `EQUIP_SIGILS`                | `uint[13]`  | Sigil ids of the 12 positions, then a 13th value, always 0   |
| 1404      | `EQUIP_SKILLS`                | `uint[4]`   | Skill keys                                                   |
| 1501      | not named                     | `int`       | Always 0                                                     |
| 1502      | not named                     | `int`       | 0 or 7                                                       |
| 1503      | not named                     | `int[2]`    | -1, -1 on characters not recruited                           |
| 1504      | not named                     | `int[2]`    | 0, 0 or 1, 1                                                 |

- 1309, 1310, 1312 and 1313 are the character's own stats. They leave out gear, fate episodes and masteries, and none of them is the stat the game displays. Characters with no `chara_status` rows hold 0.
- 1323 equals a `chara_master_exp.TotalMSP` row, and the row index is the master level. 0 reads as master level 1.
- The delegate is the character set in the Backup Characters menu for other players to enlist. The message is set there after picking one.
- A character unit holds the character's current gear, apart from its saved loadouts.

### Flags

1305 uses bits 0, 3, 4, 13 and 14.

| Bit | Value    | Name               | Set on                                                                                               |
| --- | -------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 0   | `0x1`    | `CHARACTER_JOINED` | In the crew: the starting cast from a new game on, both captains included, and others once they join |
| 3   | `0x8`    | not named          | Set in place of bit 4 on one character                                                               |
| 4   | `0x10`   | not named          | Probably characters recruited outside the main story, set before they join, DLC ones included        |
| 13  | `0x2000` | not named          |                                                                                                      |
| 14  | `0x4000` | not named          | Only on recruited characters, and not in every save                                                  |

## Special units

Not every unit is a playable character.

| `chara` rows              | Level | Holds                                                                |
| ------------------------- | ----- | -------------------------------------------------------------------- |
| Gran and Djeeta           | any   | Both captains keep a unit. The one not picked stays at level 1       |
| `NP*`, `PL000B`, `PL2000` | 1     | No `chara_status` rows, HP and ATK 0                                 |
| `SLOT01` to `SLOT04`      | 1     | XP, and another character's starter weapon and skills with no sigils |

`USER_CAPTAIN` (1103) holds the captain picked at the start. The `SLOT` rows have no name, element -1 and UI order 1000-1003. What they are for is not known.

## Party

| Entities                    | Name              | Holds                                                 |
| --------------------------- | ----------------- | ----------------------------------------------------- |
| 103000-103003               | `PARTY_FIRST`     | `PARTY_CHARACTER` (2201), `chara.CharId` per position |
| 104000-104003               | not named         | Four members in the equipment shape, use not known    |
| 105000 + set \* 10 + member | `PARTY_SET_FIRST` | Party set 0-29, member 0-3, in the equipment shape    |

- The equipment shape is the one loadouts use: `EQUIP_CHARACTER` (3003), `EQUIP_WEAPON` (1402), `EQUIP_SIGILS` (1403) and `EQUIP_SKILLS` (1404).
- An unused party set member holds the empty hash in 3003.
- 104000-104003 matches neither the current party nor a saved set. It is likely a leftover of a deleted set.
- 3004, 3005 and 3007 sit here as on loadouts, with no meaning assigned.

## Loadouts

Loadouts occupy 615 entities, `LOADOUT_FIRST` (20000) to 20614, in 41 blocks of 15. A block belongs to one character. The block order does not follow the character units.

| Attribute | Name              | Type       | Holds                                                      |
| --------- | ----------------- | ---------- | ---------------------------------------------------------- |
| 1402      | `EQUIP_WEAPON`    | `uint`     | Weapon id                                                  |
| 1403      | `EQUIP_SIGILS`    | `uint[13]` | Sigil ids of the 12 positions, then a 13th value, always 0 |
| 1404      | `EQUIP_SKILLS`    | `uint[4]`  | Skill keys                                                 |
| 3001      | not named         | `int`      | Always -1                                                  |
| 3002      | `LOADOUT_NAME`    | `byte[64]` | Name, ASCII up to the first 0                              |
| 3003      | `EQUIP_CHARACTER` | `uint`     | `chara.CharId`, the empty hash on an unused loadout        |
| 3004      | not named         | `int`      | No meaning assigned                                        |
| 3005      | not named         | `uint[5]`  | Hashes, no meaning assigned                                |
| 3007      | not named         | `uint[50]` | Hashes, no meaning assigned                                |

- Every save has all 615 units, a new game included.
- Bytes after the first 0 in 3002 are left over from the default name, such as the tail of "Loadout 02".
- 3004, 3005 and 3007 also sit on party sets and 104000-104003. 3001 sits on loadouts only.
