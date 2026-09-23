# Weapons and wrightstones

A weapon carries two separate trait lists. Its own five trait positions sit on the weapon unit. The traits of the wrightstone applied to it live in a trait list of their own.

## The weapon unit

Weapons occupy 256 entities, `WEAPON_FIRST` (40000) to 40255. `WEAPON_ID` (2802) gives the id the equip positions reference. An id of 0 or an unresolved `WEAPON_KEY` (2803) marks an empty entry.

| Attribute | Name                   | Type      | Holds                                                          |
| --------- | ---------------------- | --------- | -------------------------------------------------------------- |
| 2802      | `WEAPON_ID`            | `uint`    | Id the equip positions point at                                |
| 2803      | `WEAPON_KEY`           | `uint`    | `weapon.Key` hash                                              |
| 2804      | `WEAPON_XP`            | `uint`    | Experience                                                     |
| 2805      | `WEAPON_UNCAP`         | `int`     | Uncap level                                                    |
| 2806      | `WEAPON_PLUS`          | `int`     | Plus value                                                     |
| 2807      | `WEAPON_AWAKENING`     | `int`     | Awakening level                                                |
| 2813      | `WEAPON_QUESTS_USED`   | `uint`    | Times taken into a quest                                       |
| 2814      | `WEAPON_APPEARANCE`    | `uint`    | `weapon.Key` of the chosen look                                |
| 2815      | `WEAPON_FLAGS`         | `uint`    | `WEAPON_OWNED` 1, `WEAPON_SEEN` 64, `WEAPON_AWAKENING_SEEN` 16 |
| 2816      | `WEAPON_WRIGHTSTONE`   | `uint`    | `item.Key` of the applied stone                                |
| 2817      | `WEAPON_TRANSCENDENCE` | `int`     | Transcendence stage                                            |
| 2818      | `WEAPON_TRAITS`        | `uint[5]` | Five `skill.Key` hashes, one per trait position                |

`WEAPON_TRAITS` is a single vector of `WEAPON_TRAIT_POSITIONS` (5) hashes. Neither the vector nor the unit holds a level for them. An unlocked position holds the hash of an empty string, which `keyOf` returns as undefined.

## Ownership

`WEAPON_OWNED`, bit 0 of the flags, marks a weapon the player holds. An entry without it is one the game keeps for its own use: a `_A0` or `_99` key standing in for a weapon's look, a copy held for the captain not in play, and the starter weapon of a character not yet recruited. Only an owned weapon can be equipped.

A weapon belongs to the character its key names, `WEP_<CharId>_*`. The inventory keeps a separate entry per character even where two hold the same weapon, so the two captains never share one.

## Series

The save holds no series. It comes from the `weapon` table's `Unk30`, as `WEAPON_SERIES` in `src/data/weapons.ts`. Every character has one weapon of each series, and the traits the weapon carries name it.

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

A weapon list goes by series, in `WEAPON_SERIES_ORDER`. The game keeps its own order in `weapon.SortOrder`, which agrees with this for every character but Sandalphon, Id and Seofon, whose ascension weapon the game lists last.

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

## Applied stones

An applied stone has no inventory unit. Applying a wrightstone moves its traits onto the weapon. The weapon keeps the stone's `item.Key` in `WEAPON_WRIGHTSTONE`, and the traits become the weapon's `TRAIT_WEAPON` list. Nothing remains under `WRIGHTSTONE_FIRST` for it.

Applying a stone changes these units and no others.

| Units                                         | Change                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `WEAPON_WRIGHTSTONE` on the weapon            | Empty to the stone's `item.Key`                                               |
| The weapon's `TRAIT_WEAPON` list              | Empty to the stone's traits, keys and levels, in the stone's order            |
| `WRIGHTSTONE_KEY`, `_ID`, `_LOCKED`, `_FLAGS` | Reset to empty, 0, false and 0, the values of an unused entity                |
| The stone's `TRAIT_WRIGHTSTONE` list          | Reset to empty keys at level 0                                                |
| `ITEM_COUNT` of the stone's `item.Key`        | Down by 1, the count of loose stones with that key                            |
| Unit 5815 at entity 0, index 195              | Up by 1, progress by `badge.BehaviorId` for the trophies for applying a stone |

The emptied stone entity stays where it is. The game does not move the stones after it, and `WRIGHTSTONE_LAST_ID` does not change.

Every weapon holds `WEAPON_WRIGHTSTONE` and a three index `TRAIT_WEAPON` list whether a stone is applied or not, so a weapon without one reads the empty hash at level 0.

## Removing a stone

The game has no way to take a stone off a weapon. `removeWrightstone` in `src/domains/weapon/edit.ts` discards it: `WEAPON_WRIGHTSTONE` and the three trait keys go to the empty hash and the trait levels to 0, the state of a weapon never applied a stone. No stone returns to the inventory, so the item count and trophy progress stay as they are.
