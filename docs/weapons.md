# Weapons and wrightstones

A weapon carries two separate trait lists. Its own five trait positions sit on the weapon unit. The traits of the wrightstone applied to it live in a trait list of their own.

## The weapon unit

Weapons occupy 256 entities, `WEAPON_FIRST` (40000) to 40255. `WEAPON_ID` (2802) gives the id the equip positions reference. An id of 0 or an unresolved `WEAPON_KEY` (2803) marks an empty entry.

| Attribute | Name                   | Type      | Holds                                                       |
| --------- | ---------------------- | --------- | ----------------------------------------------------------- |
| 2802      | `WEAPON_ID`            | `uint`    | Id the equip positions point at                             |
| 2803      | `WEAPON_KEY`           | `uint`    | `weapon.Key` hash                                           |
| 2804      | `WEAPON_XP`            | `uint`    | Experience                                                  |
| 2805      | `WEAPON_UNCAP`         | `int`     | Uncap level                                                 |
| 2806      | `WEAPON_PLUS`          | `int`     | Plus value                                                  |
| 2807      | `WEAPON_AWAKENING`     | `int`     | Awakening level                                             |
| 2813      | `WEAPON_QUESTS_USED`   | `uint`    | Times taken into a quest                                    |
| 2814      | `WEAPON_APPEARANCE`    | `uint`    | `weapon.Key` of the chosen look                             |
| 2815      | `WEAPON_FLAGS`         | `uint`    | `listOpened` 1, `awakeningSeen` 16, `seen` 64, `forged` 128 |
| 2816      | `WEAPON_WRIGHTSTONE`   | `uint`    | `item.Key` of the applied stone                             |
| 2817      | `WEAPON_TRANSCENDENCE` | `int`     | Transcendence stage                                         |
| 2818      | `WEAPON_TRAITS`        | `uint[5]` | Five `skill.Key` hashes, one per trait position             |

`WEAPON_TRAITS` is a single vector of `WEAPON_TRAIT_POSITIONS` (5) hashes. Neither the vector nor the unit holds a level for them. An unlocked position holds the hash of an empty string, which `keyOf` returns as undefined.

## Ownership

A held weapon is an entry whose `WEAPON_ROWS` row has `obtainable`, from `weapon.unk52`. The rest are entries the game keeps for its own use: a `_A0` or `_99` key standing in for a weapon's look, and a story stand-in's weapon such as `WEP_NP0300_01`. The copy of the captain not in play has a key in the set and is left out by `CAPTAIN`. A character not yet recruited can hold a `_01` starter.

Bit 0 of the flags does not mark ownership. `FUN_140316020`, called from `ui::component::ControllerSubList` and `ControllerBlacksmithSelectList`, sets it on the held weapons of one character when a weapon list opens, so a fresh forge stays without it until then. `FUN_140310c30` sets it on the default weapons it forges and `FUN_141bc4e20` on one weapon by id. `FUN_140313890` does not read it. Bit 7 (128) is set at every forge by `FUN_140311e00`.

A `_99` key is also a weapon for a story fight. `WEP_PL0000_99` and `WEP_PL0100_99`, XP 162540 and uncap 6, are added and equipped on both captains for the fight in story Chapter 8, without bit 0. After it the captain in play returns to `_03`, which the game raises to XP 1740 and uncap 3, and the other captain stays on `_99`. Both entries stay in the list.

The save holds no owner. A weapon belongs to the character in the `weapon` table's `CharaId`, as `WEAPON_ROWS` in `packages/weapon/data.gen.ts`, read into `Weapon.character`. For a `WEP_<CharId>_*` key this is the character the key names. A DLC weapon's key is a bare hash, such as `219EE448`, and only the table names its owner. The inventory keeps a separate entry per character even where two hold the same weapon, so the two captains never share one.

`readOwnedWeapons` gives the held weapons of the Collection series by `chara.CharId`, then by series. No save holds two held weapons of one series for a character; the first held is kept.

## Uncap and level

2805 is an index into `weapon_limit`, whose levels are 10, 30, 50, 75, 100, 125 and 150. 2804 is the `weapon_exp.Exp` of a level, by row: the first row is level 1, the 150th 162540. `weapon.MaxUncap` and `weapon.MaxLevel` are -1 on all but three series 7 weapons: `WEP_PL0000_10` and `WEP_PL0100_10` at 2 and 50, and `2C8681F8` at 5 and 125. `weapon.ForgedUncapLevel` and `weapon.ForgedWeaponLevel` give a forged weapon's start.

An uncap, `FUN_1441c9ff0`, takes `item_material_list.CoinCost` and the items of the new stage's row in `UncapMaterialTierMapId`. One Damascus Ingot replaces the items and leaves the rupies. A level takes `weapon_exp.GoldCostPerExp` of its row in rupies, and XP comes from `item.OnUseExp` of the Fortitude items. `FUN_140312a80` writes 2804.

5815 entries:

| Entry                  | Written by                            | Holds                                                                                                                            |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 225                    | `FUN_140ab7de0`                       | Adds the rupies spent                                                                                                            |
| 186                    | `FUN_140abb380`, from `FUN_140313400` | Adds 1 per uncap                                                                                                                 |
| Trove, `WEAPON_TROVES` | `FUN_140abb380`, from `FUN_140313400` | Set to the owner's weapons at their last stage, at an uncap                                                                      |
| 185                    | `FUN_140abc120`, from `FUN_140313890` | Set to the summed levels of held weapons of joined characters (1305 bits 0-1 at 1), series 7 left out, at a level and at a forge |

The 185 sum matches finished and played saves. Each of these functions earns the entry's trophies when it writes, and none of them runs at a load, so a count met on a load stays unearned until the entry is written again.

`maxWeaponSeries` unlocks a character's missing weapons, then takes the held weapons of the Collection series to uncap 6 and level 150, no rupies or materials spent. It adds the uncaps to 186, sets 185 and the owner's Trove entry, and earns the trophies they meet. 501 is left to the game, which recounts it at a load. `canMaxWeaponSeries` holds while it would change a weapon, an entry or a trophy, so it also repairs a save with the weapons already maxed. `maxAllWeaponSeries` runs it on every character it would change, and `canMaxAllWeaponSeries` holds while one remains.

## Forging

`FUN_140311e00` adds a weapon in the first entry with an id of 0, unless `FUN_140312750` finds one held already.

| Unit                                                       | Write                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2801, 2802                                                 | The next id                                                                        |
| 2803                                                       | Key                                                                                |
| 2804, 2805                                                 | `weapon_exp.Exp` of `weapon.ForgedWeaponLevel`, and `weapon.ForgedUncapLevel`      |
| 2815                                                       | `forged`, 128                                                                      |
| 7403                                                       | Bit 2 of the weapon's field note                                                   |
| 5815 at 184, 998                                           | Set by `FUN_140aba650` to the held weapons of joined characters, series 7 left out |
| 5815 at the owner's Collection entry, `WEAPON_COLLECTIONS` | Set by `FUN_140aba650` to the owner's held weapons                                 |
| 5815 at 185                                                | Set by `FUN_140313890`                                                             |
| 5815 at the owner's Trove entry                            | Set by `FUN_140313400` when the weapon is series 0                                 |

The Collection and Trove counts of `PL2100`, `PL2200` and `PL2300` leave out weapons with a `weapon.MinFeatureVersion` of 5 or more. The Trove also counts a held series 0 weapon below its last stage. The rupies, items and 225 belong to the blacksmith's `FUN_1441c8b10`. 8913 counts forges.

`unlockWeaponSeries` makes these writes for each series the character does not hold, none on the captain not in play, with no rupies or materials spent, and earns the trophies the counts meet. It adds the row with `forged` in `WEAPON_ROWS`, one per character and series: not a `WeaponId2` variant, and preferring a row whose `ForgeUnlockQuestId` is not `00999999`. `unlockAllWeaponSeries` runs it on every character.

## Series

The save holds no series. It comes from the `weapon` table's `Unk30`, as `WEAPON_ROWS` in `packages/weapon/data.gen.ts`. A character has at most one weapon of each series, some later characters only four of the six, and the traits the weapon carries name it.

| Series | Name             | Traits                              |
| ------ | ---------------- | ----------------------------------- |
| 0      | Terminus Weapon  | Catastrophe, Regen                  |
| 1      | Stunner          | Stun Power, Linked Together         |
| 2      | Ascension Weapon | ATK, HP                             |
| 3      | Stinger          | Critical Hit Rate, Critical Hit DMG |
| 4      | Defender         | HP, Garrison                        |
| 5      | Executioner      | Weak Point DMG, Break Assassin      |
| 6      | not named        | Sits on the unused `_07` weapons    |
| 7      | Bonus Weapon     |                                     |

The names are game text, under the `weaponSeries` table by series number.

The Collection counts series 0 to 5, `COLLECTION_SERIES`. A weapon list goes by series, in `WEAPON_SERIES_ORDER`. The game keeps its own order in `weapon.SortOrder`, which agrees with this for every character but Sandalphon, Id and Seofon, whose ascension weapon the game lists last.

## Trait lists

Traits with levels live in their own units at `TRAIT_FIRST + holder * TRAIT_STRIDE + index` (120000000 + …). Each index holds `TRAIT_KEY` (1701, a `skill.Key` hash) and `TRAIT_LEVEL` (1702, an int).

The holder number keeps the lists apart.

| Holder base         | Value  | List                               |
| ------------------- | ------ | ---------------------------------- |
| `TRAIT_WEAPON`      | 100000 | Traits of a weapon's applied stone |
| `TRAIT_WRIGHTSTONE` | 200000 | Traits of an inventory stone       |
| `TRAIT_SIGIL`       | 0      | A sigil's primary and secondary    |

The holder is the entry's index within its inventory, so a weapon at entity 40007 reads holder `100000 + 7` and a wrightstone at 50003 reads holder `200000 + 3`.

## Trait levels

Levels sit on the trait, not on the stone. Every level comes from the `TRAIT_LEVEL` beside the trait's own key.

| Attribute | Name          | Type   | Holds            |
| --------- | ------------- | ------ | ---------------- |
| 1701      | `TRAIT_KEY`   | `uint` | `skill.Key` hash |
| 1702      | `TRAIT_LEVEL` | `int`  | Trait level      |

The wrightstone unit holds no level data. Wrightstones occupy 5000 entities, `WRIGHTSTONE_FIRST` (50000) to 54999.

| Attribute | Name                  | Type   | Holds                                                               |
| --------- | --------------------- | ------ | ------------------------------------------------------------------- |
| 2101      | `WRIGHTSTONE_LAST_ID` | `uint` | At entity 0 only: the highest id in use, 0 when none                |
| 2102      | `WRIGHTSTONE_KEY`     | `uint` | `item.Key` of the stone tier, such as Vitality or Dread Wrightstone |
| 2103      | `WRIGHTSTONE_ID`      | `uint` | Id                                                                  |
| 2104      | `WRIGHTSTONE_LOCKED`  | `bool` | Locked                                                              |
| 2105      | `WRIGHTSTONE_FLAGS`   | `uint` | `WRIGHTSTONE_SEEN` 2                                                |

A wrightstone's trait list holds the main trait, then the two subs.

### Trait rolls

`item_pendulum` has one row per stone key. `MainSkill` is the main trait. A level comes from `LvPrimarySkill` or `LvSubSkill<n>` when set, otherwise from the `skill_level_lot` row its `SkillLevelLotFor…` column names. A sub is a fixed `SubSkill<n>` when set, otherwise present when `WeightSubSkill<n>` is above 0 and drawn from the `skill_type_lot` row `QuestExBaseDataId` names: one of up to six `skill_lot` groups by its chance, then one trait of the group.

The top stones, `ITEM_2<f>_0130` and `_0131`, roll as follows:

| Family    | Main trait                       |
| --------- | -------------------------------- |
| `ITEM_25` | `SKILL_004_00` Stun Power        |
| `ITEM_26` | `SKILL_003_00` Critical Hit Rate |
| `ITEM_27` | `SKILL_001_00` HP                |
| `ITEM_28` | `SKILL_014_00` Weak Point DMG    |

| Key     | Main     | Sub 1   | Sub 2  |
| ------- | -------- | ------- | ------ |
| `_0131` | 20       | 15      | 10     |
| `_0130` | 10 or 15 | 7 or 10 | 5 or 7 |

- Each `_0130` level is drawn on its own, so all eight combinations occur.
- The subs of all four families come from one set of 71 traits, `skill_type_lot` 22-25: ATK, HP, Critical Hit Rate and Stun Power; 21 attack traits; 21 defense traits and resistances; two groups of 8; and 9 Endless Ragnarok traits (`SKILL_144_00` to `SKILL_166_00`). The family's own main trait is the one left out.
- The two subs are drawn independently and can be the same trait.

## Applied stones

An applied stone has no inventory unit. Applying a wrightstone moves its traits onto the weapon. The weapon keeps the stone's `item.Key` in `WEAPON_WRIGHTSTONE`, and the traits become the weapon's `TRAIT_WEAPON` list. Nothing remains under `WRIGHTSTONE_FIRST` for it.

Only an unlocked stone can be applied, so `WRIGHTSTONE_LOCKED` is already false. Applying a stone changes these units and no others, in one step.

| Units                                  | Change                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `WEAPON_WRIGHTSTONE` on the weapon     | Empty to the stone's `item.Key`                                               |
| The weapon's `TRAIT_WEAPON` list       | Empty to the stone's traits, keys and levels, in the stone's order            |
| `WRIGHTSTONE_KEY`, `_ID`, `_FLAGS`     | Reset to empty, 0 and 0, the values of an unused entity with `_LOCKED` false  |
| The stone's `TRAIT_WRIGHTSTONE` list   | Reset to empty keys at level 0                                                |
| `ITEM_COUNT` of the stone's `item.Key` | Down by 1, the count of loose stones with that key                            |
| Unit 5815 at entity 0, index 195       | Up by 1, progress by `badge.BehaviorId` for the trophies for applying a stone |

The emptied stone entity stays where it is. The game does not move the stones after it, and `WRIGHTSTONE_LAST_ID` does not change.

Every weapon holds `WEAPON_WRIGHTSTONE` and a three index `TRAIT_WEAPON` list whether a stone is applied or not, so a weapon without one reads the empty hash at level 0.

## Removing a stone

The game has no way to take a stone off a weapon. `removeWrightstone` in `packages/weapon/edit.ts` discards it: `WEAPON_WRIGHTSTONE` and the three trait keys go to the empty hash and the trait levels to 0, the state of a weapon never applied a stone. No stone returns to the inventory, so the item count and trophy progress stay as they are.
