# Characters

A character is one unit per `chara` row. `readCharacters` in `src/domain/characters.ts` reads it. Master traits, masteries and over-masteries sit in per-character progress units under their own UnitIDs.

## The character unit

Characters occupy 41 UnitIDs, `UNIT.CHARACTER` (10000) to 10040, one per `chara` row. The character index is the UnitID minus 10000. Every save has all 41 units, a new game included.

| IDType | Name                          | Type        | Holds                                                        |
| ------ | ----------------------------- | ----------- | ------------------------------------------------------------ |
| 1301   | `CHARACTER_KEY`               | `uint`      | `chara.CharId` hash                                          |
| 1302   | not named                     | `int`       | Always 0                                                     |
| 1303   | `CHARACTER_XP`                | `int`       | XP, 8,400,000 at level 100                                   |
| 1304   | not named                     | `int`       | Always 0                                                     |
| 1305   | `CHARACTER_FLAGS`             | `uint`      | Flags                                                        |
| 1307   | not named                     | `int`       |                                                              |
| 1308   | `CHARACTER_LEVEL`             | `int`       | Level                                                        |
| 1309   | `CHARACTER_BASE_HP`           | `int`       | Base HP, `chara_status.Hp` at the level                      |
| 1310   | `CHARACTER_BASE_ATTACK`       | `int`       | Base ATK, `chara_status.Attack` at the level                 |
| 1311   | not named                     | `int`       | Always 0                                                     |
| 1312   | `CHARACTER_BASE_STUN`         | `float`     | Base Stun Power, `chara_status.Stun`                         |
| 1313   | `CHARACTER_BASE_CRIT`         | `int`       | Base Critical Hit Rate, `chara_status.CritRate`              |
| 1314   | `CHARACTER_QUESTS_USED`       | `uint`      | Number of quests the character was used in                   |
| 1315   | not named                     | `uint`      | Always the empty hash                                        |
| 1316   | not named                     | `uint`      |                                                              |
| 1317   | not named                     | `uint`      |                                                              |
| 1318   | not named                     | `uint`      | Bitmask, up to 6 bits                                        |
| 1321   | not named                     | `uint`      | Possibly the highest single hit, unconfirmed                 |
| 1322   | not named                     | `uint`      | 0 on NPCs, 1 or 3 on playable characters and the `SLOT` rows |
| 1323   | `CHARACTER_MASTER_XP`         | `int`       | MSP spent on master levels                                   |
| 1324   | `CHARACTER_DELEGATE_ENLISTED` | `int`       | Probably the times the character was enlisted as a delegate  |
| 1325   | not named                     | `int`       | Always -1                                                    |
| 1326   | `CHARACTER_DELEGATE_MESSAGE`  | `byte[241]` | Delegate message, padded with 0                              |
| 1402   | `EQUIP_WEAPON`                | `uint`      | Weapon slot id                                               |
| 1403   | `EQUIP_SIGILS`                | `uint[13]`  | Sigil slot ids                                               |
| 1404   | `EQUIP_SKILLS`                | `uint[4]`   | Skill keys                                                   |
| 1501   | not named                     | `int`       | Always 0                                                     |
| 1502   | not named                     | `int`       | 0 or 7                                                       |
| 1503   | not named                     | `int[2]`    | -1, -1 on characters not recruited                           |
| 1504   | not named                     | `int[2]`    | 0, 0 or 1, 1                                                 |

- 1309, 1310, 1312 and 1313 are the character's own stats. They leave out gear, fate episodes and masteries, and none of them is the stat the game displays. Characters with no `chara_status` rows hold 0.
- 1323 equals a `chara_master_exp.TotalMSP` row, and the row index is the master level. 0 reads as master level 1.
- The delegate is the character set in the Backup Characters menu for other players to enlist. The message is set there after picking one.
- `weapons.md` and `sigils.md` cover the equipment IDTypes. A character unit holds the character's current gear, apart from its saved loadouts.

### Flags

1305 uses bits 0, 3, 4, 13 and 14.

| Bit | Value    | Name      | Set on                                                                                        |
| --- | -------- | --------- | --------------------------------------------------------------------------------------------- |
| 0   | `0x1`    | not named | Captains and recruited characters                                                             |
| 3   | `0x8`    | not named | Set in place of bit 4 on one character                                                        |
| 4   | `0x10`   | not named | Probably characters recruited outside the main story, set before they join, DLC ones included |
| 13  | `0x2000` | not named |                                                                                               |
| 14  | `0x4000` | not named | Only on recruited characters, and not in every save                                           |

## Special units

Not every unit is a playable character.

| `chara` rows              | Level | Holds                                                                |
| ------------------------- | ----- | -------------------------------------------------------------------- |
| Gran and Djeeta           | any   | Both captains keep a unit. The one not picked stays at level 1       |
| `NP*`, `PL000B`, `PL2000` | 1     | No `chara_status` rows, HP and ATK 0                                 |
| `SLOT01` to `SLOT04`      | 1     | XP, and another character's starter weapon and skills with no sigils |

`USER_CAPTAIN` (1103) holds the captain picked at the start. The `SLOT` rows have no name, element -1 and UI order 1000-1003. What they are for is not known.

## Progress units

Per-character progress sits at `CHARACTER_PROGRESS` (10000000) + character index \* 1000 + entry. 1601 and 1602 at UnitIDs 0-199 hold the Resonance tree, which `conflux.md` covers.

| IDType | Name                           | Type   | Entries | Holds                                                        |
| ------ | ------------------------------ | ------ | ------- | ------------------------------------------------------------ |
| 1601   | `PROGRESS_KEY`                 | `uint` | 0-399   | Mastery node `LimitBonusId` or `skillboard_effect.Key`       |
| 1602   | `PROGRESS_VALUE`               | `int`  | 0-399   | Node bitmask or master trait selection                       |
| 1606   | `CHARACTER_OVER_MASTERY_KEY`   | `uint` | 0-3     | `limit_bonus_param.Key` of a `MED_EFF_*` stat                |
| 1607   | `CHARACTER_OVER_MASTERY_LEVEL` | `int`  | 0-3     | Roll level as one bit, level n is `1 << (n-1)`, 0 when empty |

### Masteries

The entries start with the character's mastery nodes: every `LimitBonusId` of its `ap_tree_atk`, `ap_tree_def`, `ap_tree_wep` and `ap_tree_rebuild` rows. 1602 holds a bitmask per node.

| Bits  | Holds                                                        |
| ----- | ------------------------------------------------------------ |
| 0-7   | Bit n set when the node at `LimitBonusParamIndex` n is taken |
| 8-15  | A subset of bits 0-7, likely nodes granted on joining        |
| 16-31 | Always 0                                                     |

- The extension is the Offense and Defense rows at `DiffSeparatorMaybe` 311 and up.
- Transcendence counts the `ap_tree_rebuild` rows at `ReqWepTranscensionLevel` 7 only. The T1-6 rows are never set.

### Master traits

The master trait cells follow the nodes: 99 `skillboard_effect.Key` entries, 111 for the captains, then empty ids. 1602 is 1 when the cell is selected and 0 otherwise.

Cells join to `skillboard_layout` through `SkillboardEffectOrUiId`, which gives the style (`SkillboardCategoryId`), the rank (`SkillboardGroupId`) and the perk flag (`Unk25` = 100). Within a style the cells run in `skillboard_layout.Unk30` order: the three perks, then the ordinary cells rank by rank.

| `Unk30`     | Cells                  |
| ----------- | ---------------------- |
| 0, 100, 200 | Insight, Essence, Crux |
| +0 to +2    | Perks                  |
| +10         | Rank 1                 |
| +20         | Rank 2                 |
| +30         | Rank 3                 |
| +50         | EX                     |

A trait's text is `skillboard_effect.Unk19`. `{n}` in it is `Value(n % 10 + 1)` of action part `n / 10` in `skillboard_effect_action_parts`, through `SkillboardEffectActionPartsId1` to 3. Stun Power parts (`SubType` 8, `MainType` 8) hold 1/10 of the displayed value.
