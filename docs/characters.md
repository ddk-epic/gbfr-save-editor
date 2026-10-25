# Characters

A character is one unit per `chara` row.

## The character unit

Characters occupy 41 entities, `CHARACTER_FIRST` (10000) to 10040, one per `chara` row. The character index is the entity minus 10000. Every save has all 41 units, a new game included.

| Attribute | Name                           | Type        | Holds                                                        |
| --------- | ------------------------------ | ----------- | ------------------------------------------------------------ |
| 1301      | `CHARACTER_KEY`                | `uint`      | `chara.CharId` hash                                          |
| 1302      | not named                      | `int`       | Always 0                                                     |
| 1303      | `CHARACTER_XP`                 | `int`       | XP, 8,400,000 at level 100                                   |
| 1304      | not named                      | `int`       | Always 0                                                     |
| 1305      | `CHARACTER_FLAGS`              | `uint`      | Flags                                                        |
| 1307      | not named                      | `int`       |                                                              |
| 1308      | `CHARACTER_LEVEL`              | `int`       | Level                                                        |
| 1309      | `CHARACTER_BASE_HP`            | `int`       | Base HP, `chara_status.Hp` at the level                      |
| 1310      | `CHARACTER_BASE_ATTACK`        | `int`       | Base ATK, `chara_status.Attack` at the level                 |
| 1311      | not named                      | `int`       | Always 0                                                     |
| 1312      | `CHARACTER_BASE_STUN`          | `float`     | Base Stun Power, `chara_status.Stun`                         |
| 1313      | `CHARACTER_BASE_CRIT`          | `int`       | Base Critical Hit Rate, `chara_status.CritRate`              |
| 1314      | `CHARACTER_QUESTS_USED`        | `uint`      | Number of quests the character was used in                   |
| 1315      | `CHARACTER_STAND_IN`           | `uint`      | `chara.CharId` the character plays as, or the empty hash     |
| 1316      | not named                      | `uint`      |                                                              |
| 1317      | not named                      | `uint`      |                                                              |
| 1318      | not named                      | `uint`      | Bitmask, up to 6 bits                                        |
| 1321      | not named                      | `uint`      | Possibly the highest single hit, unconfirmed                 |
| 1322      | not named                      | `uint`      | 0 on NPCs, 1 or 3 on playable characters and the `SLOT` rows |
| 1323      | `CHARACTER_MASTER_XP`          | `int`       | MSP spent on master levels                                   |
| 1324      | `CHARACTER_DELEGATE_ENLISTED`  | `int`       | Probably the times the character was enlisted as a delegate  |
| 1325      | not named                      | `int`       | Always -1                                                    |
| 1326      | `CHARACTER_DELEGATE_MESSAGE`   | `byte[241]` | Delegate message, padded with 0                              |
| 1402      | `EQUIP_WEAPON`                 | `uint`      | Weapon id                                                    |
| 1403      | `EQUIP_SIGILS`                 | `uint[13]`  | Sigil ids of the 12 positions, then a 13th value, always 0   |
| 1404      | `EQUIP_SKILLS`                 | `uint[4]`   | Skill keys                                                   |
| 1501      | not named                      | `int`       | Always 0                                                     |
| 1502      | not named                      | `int`       | 0 or 7                                                       |
| 1503      | not named                      | `int[2]`    | -1, -1 on characters not recruited                           |
| 1504      | `CHARACTER_MASTER_BREAK_MARKS` | `int[2]`    | New marks of the master level cap breaks                     |

- 1309, 1310, 1312 and 1313 are the character's own stats. They leave out gear, fate episodes and masteries, and none of them is the stat the game displays. Characters with no `chara_status` rows hold 0.
- 1323 equals a `chara_master_exp.TotalMSP` row, and the row index is the master level. 0 reads as master level 1.
- The delegate is the character set in the Backup Characters menu for other players to enlist. The message is set there after picking one.
- 1315 is set while a story party holds the character. On a new game `PL1200` plays as `NP0000`, with the `AB_NP0000_*` skills. The game reads 1315 in place of the character's own key (`FUN_1402e4800`), and every party preset resets it to the empty hash (`FUN_1402e38e0`).
- A character unit holds the character's current gear, apart from its saved loadouts.
- 1402 holds `WEAPON_ID` (2802), not the weapon's entity. It is the only place a live weapon is equipped: the weapon unit itself carries no mark. Switching a weapon writes this unit, and 5815 index 1015 when the character's power rating crosses 45,000, see [trophies](trophies.md).

### Level

Gaining XP (`FUN_1402b51f0`, applied in `FUN_1402b5ad0`) writes 1303, then sets 1308 to the number of `chara_exp` rows of the character's `chara.CharaExp` curve at or below the XP. On a level change it recomputes 1309 to 1313 from `chara_status`:

- Each stat is interpolated linearly between the character's two rows around the level. Rows that hold 0 for a stat are skipped, so Stun Power and Critical Hit Rate stay at their level 1 values of 8 and 5.
- `chara_status` has a row at `chara.MaxLevelMaybe` (100) for every playable character, so the max level stats are that row's. Every curve reaches 8,400,000 XP at level 100.

A level-up in a quest also:

- Adds the `chara_exp.MSPReward` of each level gained to MSP (1112), capped at 9,999,999.
- Sets or clears bit 0 of each of the character's fate episodes by its `ReqLevel` (`FUN_14032a920`). The fate episode menu does the same check when it opens.
- Shows notices on crossing level 80, 90 and 100, and when the open sigil slots go up. These write no unit.

`maxCharacterLevel` sets 1303 to 8,400,000, 1308 to 100, and 1309 and 1310 to the `CHARACTER_MAX_STATS` row. It awards no MSP.

### Master level

1323 is the MSP spent on master levels, the `chara_master_exp.TotalMSP` row of the master level, 55 at most. A level-up in the mastery menu (`FUN_144012310`) takes the level's cost from MSP (1112) and adds it to 1323. Levels 51 to 55 are the five master level cap breaks.

Past level 50 the level-up also:

- Sets bit 13 of 1305, the cap break's new mark. `FUN_143b27670` clears it.
- Writes the number of cap breaks to each 1504 entry that holds 0 (`FUN_140295a80`). The two entries are the new marks of two menus, set to 0 when viewed (`FUN_143b259a0`, `FUN_143b25d50`, `FUN_143b28210`).

Neither mark is master level state: characters at level 55 can hold either or neither.

Every character with master levels has eight badges. The `PL0000` ones are the captain's, probably shared by both captains:

| `badge.Unk9` | Badges | `ReqQuantity` | Earned at               |
| ------------ | ------ | ------------- | ----------------------- |
| 19           | 3      | 10, 30, 50    | Master level 10, 30, 50 |
| 20           | 4      | 1             | Levels 51 to 54         |
| 21           | 1      | 1             | Level 55                |

- The Unk9 19 badges share one 5815 entry, set to the master level up to 50. The rest write no 5815 entry.

Three more master level badges belong to no character: `badge.CharaId` is empty, and any character's master level counts toward them. No column sets them apart; their text does.

| Badge | Text                                                    | 5815 entry | `ReqQuantity` |
| ----- | ------------------------------------------------------- | ---------- | ------------- |
| 846   | Raise a crewmate's master level for the first time      | 650        | 1             |
| 1464  | Raise a character to master level 50                    | 1053       | 50            |
| 1465  | Break the master level until it can no longer be broken | 1054       | 5             |

- Earning them has not been traced. Earned, 1053 holds 50 and 1054 holds 5, while 650 stays 0, as on the character badges of `ReqQuantity` 1.

`maxMasterLevel` sets 1323 to the level 55 row with no MSP taken, sets both new marks, and earns the character's badges and 846, 1464 and 1465, raising their 5815 entries to the `ReqQuantity`.

### Sigil slots

The save holds no slot count. The game works out a character's open slots (`FUN_1402b5990`) from two sources:

- The `chara_gem` rows of the character's `chara.CharaGemId`. A row counts once both of its conditions hold: `Unk1` 0 or at most the character's level, and `Unk2` other than 3, or `Unk3` non-zero and at most the number of the character's fate episodes completed.
- The "Unlock Sigil Slot" mastery nodes unlocked, one slot each (`limit_bonus` rows with `TXT_LB_NAME_CMN_PARAM_GNS`).

| `CharaGemId` | Rows (`Unk1`, `Unk2`, `Unk3`)   | Mastery nodes | Characters           |
| ------------ | ------------------------------- | ------------- | -------------------- |
| `GEMSLOT_01` | (1, 0, 0), (0, 3, 5), (0, 3, 9) | 9             | Every one but PL2900 |
| `GEMSLOT_02` | (1, 0, 0)                       | 11            | PL2900               |

`GEMSLOT_01` opens one slot from level 1 and one each at 5 and 9 fate episodes completed. Every character reaches 12 slots at most, `EQUIP_SIGIL_SLOTS`.

`sigilSlots` counts the same from the save: 1308 for the level, the completed bit of the character's fate episodes, and the mastery nodes taken. A sigil equipped past the open slots, on the character or on one of its loadouts, is the `sigilSlotClosed` issue.

### Flags

1305 uses bits 0, 3, 4, 13 and 14.

| Bit | Value    | Name                         | Set on                                                                                               |
| --- | -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0   | `0x1`    | `CHARACTER_JOINED`           | In the crew: the starting cast from a new game on, both captains included, and others once they join |
| 3   | `0x8`    | not named                    | Set in place of bit 4 on one character                                                               |
| 4   | `0x10`   | not named                    | Probably characters recruited outside the main story, set before they join, DLC ones included        |
| 13  | `0x2000` | `CHARACTER_MASTER_BREAK_NEW` | New mark of a master level cap break                                                                 |
| 14  | `0x4000` | not named                    | Only on recruited characters, and not in every save                                                  |

## Special units

Not every unit is a playable character.

| `chara` rows              | Level | Holds                                                                |
| ------------------------- | ----- | -------------------------------------------------------------------- |
| Gran and Djeeta           | any   | Both captains keep a unit. The one not picked stays at level 1       |
| `NP*`, `PL000B`, `PL2000` | 1     | No `chara_status` rows, HP and ATK 0                                 |
| `SLOT01` to `SLOT04`      | 1     | XP, and another character's starter weapon and skills with no sigils |

`USER_CAPTAIN` (1103) holds the captain picked at the start. The `SLOT` rows have no name, element -1 and UI order 1000-1003. What they are for is not known.

## Party

| Entities                    | Name              | Holds                                              |
| --------------------------- | ----------------- | -------------------------------------------------- |
| 103000-103003               | `PARTY_FIRST`     | The party slots, one per position                  |
| 104000-104003               | not named         | Four members in the equipment shape, use not known |
| 105000 + set \* 10 + member | `PARTY_SET_FIRST` | Party set 0-29, member 0-3, in the equipment shape |

- The equipment shape is the one loadouts use: `EQUIP_CHARACTER` (3003), `EQUIP_WEAPON` (1402), `EQUIP_SIGILS` (1403) and `EQUIP_SKILLS` (1404).
- An unused party set member holds the empty hash in 3003.
- 104000-104003 matches neither the current party nor a saved set. It is likely a leftover of a deleted set.
- 3004, 3005 and 3007 sit here as on loadouts, with no meaning assigned.

| Attribute | Name                  | Type   | Holds                                                |
| --------- | --------------------- | ------ | ---------------------------------------------------- |
| 2201      | `PARTY_CHARACTER`     | `uint` | `chara.CharId`                                       |
| 2202      | `PARTY_SLOT_LOCKED`   | `bool` | The story fixes the slot's character                 |
| 2203      | `PARTY_SLOT_REQUIRED` | `bool` | The story requires the slot's character in the party |

2401 `PARTY_KEPT`, a `bool` at `PARTY_KEPT_ENTITY` (10400), is set while the player's own party is set aside for a story party (`stage::quest::PushCurrentPartyKeep`), and cleared when it is restored (`PopCurrentPartyKeep`).

### Party presets

The story sets the party from a `formation_slot` row (`FUN_1402f2860`). It first clears 2202 and 2203 on every slot and 1315 on every character, then applies `LockPartySlot1` to `LockPartySlot4`, one per slot:

| `LockPartySlot` | Character placed                                             | Sets |
| --------------- | ------------------------------------------------------------ | ---- |
| 0               | None                                                         |      |
| 1               | The row's, in this slot                                      | 2202 |
| 2               | The row's, in the slot already holding it, else in this slot | 2203 |
| 3               | None, the current one stays                                  | 2202 |
| 4               | The row's, in this slot                                      |      |

- `PL0000` in a row stands for the captain picked at the start.
- The town row `4FA6A50B` holds `PL0000` in slot 0 with mode 2, so between story quests 2203 is set on 103000 alone.
- The Party menu refuses changes to a slot with 2202 set (`ui::fsm::action::PlayerSlotLockDialog`).

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
