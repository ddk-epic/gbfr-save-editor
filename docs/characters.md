# Characters

A character is one unit per `chara` row.

## The character unit

Characters occupy 41 entities, `CHARACTER_FIRST` (10000) to 10040, one per `chara` row. The character index is the entity minus 10000. Every save has all 41 units, a new game included. The order can differ between saves, with `PL1900` at 10021 or 10023, so 1301 is what names a unit.

| Attribute | Name                           | Type        | Holds                                                        |
| --------- | ------------------------------ | ----------- | ------------------------------------------------------------ |
| 1301      | `CHARACTER_KEY`                | `uint`      | `chara.CharId` hash                                          |
| 1302      | `CHARACTER_OUTFIT`             | `int`       | `chara_costume.SkinType` worn                                |
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
| 1316      | `CHARACTER_OUTFITS_OWNED`      | `uint`      | One bit per `chara_costume.SkinType` owned                   |
| 1317      | not named                      | `uint`      |                                                              |
| 1318      | not named                      | `uint`      | Bitmask, up to 6 bits                                        |
| 1321      | `CHARACTER_OVERFLOW_XP`        | `uint`      | XP earned at level 100, see below                            |
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

- 1503 goes from `-1, -1` to `2, -1` on the captain as a second skill goes into 1404. What the 2 stands for is not settled.
- 1309, 1310, 1312 and 1313 are the character's own stats. They leave out gear, fate episodes and masteries, and none of them is the stat the game displays. Characters with no `chara_status` rows hold 0.
- 1321 takes each XP gain above level 99 (`FUN_1402b4040`), and holds 0 below level 100. Each `constant.MaxLevelRepeatXP` (400,000) it crosses pays `MaxLevelVoucherReward` (3) `ITEM_21_0000` Knickknack Vouchers and `MaxLevelMSPReward` (100) MSP. It wraps at 400,000, or with feature `0x2b` (`FUN_140442780`, not identified) at 4,000,000, where each 10th cycle pays one `ITEM_21_0001` Transmarvel Voucher in place of the Knickknack Vouchers.
- A new game sets 1302 to 1 on `PL0000` and `PL0100` (`FUN_1402d4c60`), with 1316 at 2. `ChangeCharacterSkin` (`FUN_1431fea70`) sets 1302 and the matching 1316 bit. `GetRelinkSword` (`FUN_143204880`) clears 1316 bit 1 on both captains unless 1302 holds 1.
- 1323 equals a `chara_master_exp.TotalMSP` row, and the row index is the master level. 0 reads as master level 1.
- The delegate is the character set in the Backup Characters menu for other players to enlist. The message is set there after picking one.
- 1315 is set while a story party holds the character. On a new game `PL1200` plays as `NP0000`, with the `AB_NP0000_*` skills. The game reads 1315 in place of the character's own key (`FUN_1402e4800`), and every party preset resets it to the empty hash (`FUN_1402e38e0`). It empties and returns within about 2 s each time a preset applies with the stand-in in it, as at a story quest clear, where the character's XP rises to a new level between, and with no clear at times that fit a restart after a party defeat. It stays empty after a preset without one.
- A story stand-in's 1308-1313 fill a few seconds after a load, from a level of 1 and stats of 0, with 1303 unmoved.
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

1305 uses bits 0, 1, 3, 4, 13 and 14.

| Bit | Value    | Name                         | Set on                                                                                               |
| --- | -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0   | `0x1`    | `CHARACTER_JOINED`           | In the crew: the starting cast from a new game on, both captains included, and others once they join |
| 1   | `0x2`    | not named                    | `PL1900` while the story plays it, see below                                                         |
| 3   | `0x8`    | not named                    | `PL1900`, in place of bit 4, from its story stretch on                                               |
| 4   | `0x10`   | not named                    | Probably characters recruited outside the main story, set before they join, DLC ones included        |
| 13  | `0x2000` | `CHARACTER_MASTER_BREAK_NEW` | New mark of a master level cap break                                                                 |
| 14  | `0x4000` | not named                    | Only on recruited characters, and not in every save                                                  |

Bit 0 can clear again, as it does on `PL1900` when its story stretch ends, and it returns when the character rejoins.

### `PL1900` story stretch

`PL1900` is played on its own unit for part of `00107001`, after a `SLOT` stand-in of it. One checkpoint:

- Copies the stand-in's XP, level and stats into 1303 and 1308-1310, which can lower them.
- Sets 1305 to bits 0, 1 and 3.
- Fills 1404 with the stand-in's four skills, and sets 3904 bit 0 on `AB_PL1900_02`, `_05`, `_07` and `_08`.
- Fills 1602 on 70 entries of the mastery block, 0-42 and 108-134, and sets `TROPHY_PROGRESS` (5815) at 714 to 1.

The unit then gains XP and levels as usual. Just before the clear of `00107001`, 1305 drops to bit 3 alone. The XP, level, skills and 1602 values stay.

Early in `00109001`, the quest's `IdoEntry` step (`FUN_143212080`, `maxCharacterLevel_` 42) sets bit 0. It does nothing if bit 0 is already set. It then takes the highest level among the characters it counts, capped at 42, and raises the unit to that level if the unit is below it, with MSP for the levels gained. Which characters it counts has not been read. [`fillSkippedStory`](story-progression/fill.md) applies the same rule to a save that skipped the step.

## Special units

Not every unit is a playable character.

| `chara` rows              | Level | Holds                                                          |
| ------------------------- | ----- | -------------------------------------------------------------- |
| Gran and Djeeta           | any   | Both captains keep a unit. The one not picked stays at level 1 |
| `NP*`, `PL000B`, `PL2000` | 1     | No `chara_status` rows, HP and ATK 0                           |
| `SLOT01` to `SLOT04`      | any   | XP, and another character's weapon, skills and sigils          |

`USER_CAPTAIN` (1103) holds the captain picked at the start. The `SLOT` rows have no name, element -1 and UI order 1000-1003. They stand in for a character during the story: A `SLOT` row plays as the character in `CHARACTER_STAND_IN` (1315), at a level and with a weapon and sigils of its own, such as `PL1900` with `WEP_PL1900_A0` or `NP0300` with `WEP_NP0300_01`. `SLOT01` and `SLOT02` can run at once. They can also sit at level 1 with a starter weapon and no sigils.

A stand-in lasts part of a quest or a whole one, and can end with no checkpoint. As it ends, 1315 and the sigils clear, including the sigil entries' keys and wearer. XP, level, HP, attack, the equipped weapon id and the skills stay until the next stand-in overwrites them, and the weapon stays in the weapon list. A row can take a different character next, as `SLOT02` goes from `PL1900` to `NP0300`. A load puts level back to 1 and HP and attack to 0, and keeps XP, the weapon id and the skills.

A character returning as a stand-in reuses its weapon entry, with new XP and uncap. A stand-in can run with no weapon, such as `NP0000` with `EQUIP_WEAPON` 0. A checkpoint can reissue a stand-in's sigil ids, moving `SIGIL_LAST_ID` on. Sigil entries a stand-in frees can go to a later sigil drop.

## Party

| Entities                    | Name              | Holds                                              |
| --------------------------- | ----------------- | -------------------------------------------------- |
| 103000-103003               | `PARTY_FIRST`     | The party slots, one per position                  |
| 104000-104003               | not named         | Copy of the party kept aside, see below            |
| 105000 + set \* 10 + member | `PARTY_SET_FIRST` | Party set 0-29, member 0-3, in the equipment shape |

- The equipment shape is the one loadouts use: `EQUIP_CHARACTER` (3003), `EQUIP_WEAPON` (1402), `EQUIP_SIGILS` (1403) and `EQUIP_SKILLS` (1404).
- An unused party set member holds the empty hash in 3003.
- 104000-104003 takes the party's characters, weapons and skills in the poll where 2401 goes true. The party returns when 2401 goes false, likely from this copy, and a weapon replaced in the meantime changes in the copy in that poll. Later party changes do not reach it, so it can match neither the current party nor a saved set. The code that writes it has not been found.
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
- The town row `4FA6A50B` holds `PL0000` in slot 0 with mode 2, so between story quests 2203 is set on 103000 alone. It goes false just before `00108001` clears.
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
