# Weapons and wrightstones

A weapon carries two separate trait lists. Its own five trait positions sit on the weapon unit. The traits of the wrightstone applied to it live in a trait list of their own.

## The weapon unit

Weapons occupy 256 entities, `WEAPON_FIRST` (40000) to 40255. `WEAPON_ID` (2802) gives the id the equip positions reference. An id of 0 or an unresolved `WEAPON_KEY` (2803) marks an empty entry.

| Attribute | Name                   | Type      | Holds                                           |
| --------- | ---------------------- | --------- | ----------------------------------------------- |
| 2802      | `WEAPON_ID`            | `uint`    | Id the equip positions point at                 |
| 2803      | `WEAPON_KEY`           | `uint`    | `weapon.Key` hash                               |
| 2804      | `WEAPON_XP`            | `uint`    | Experience                                      |
| 2805      | `WEAPON_UNCAP`         | `int`     | Uncap level                                     |
| 2806      | `WEAPON_PLUS`          | `int`     | Plus value                                      |
| 2807      | `WEAPON_AWAKENING`     | `int`     | Awakening level                                 |
| 2813      | `WEAPON_QUESTS_USED`   | `uint`    | Times taken into a quest                        |
| 2814      | `WEAPON_APPEARANCE`    | `uint`    | `weapon.Key` of the chosen look                 |
| 2815      | `WEAPON_FLAGS`         | `uint`    | `WEAPON_SEEN` 64, `WEAPON_AWAKENING_SEEN` 16    |
| 2816      | `WEAPON_WRIGHTSTONE`   | `uint`    | `item.Key` of the applied stone                 |
| 2817      | `WEAPON_TRANSCENDENCE` | `int`     | Transcendence stage                             |
| 2818      | `WEAPON_TRAITS`        | `uint[5]` | Five `skill.Key` hashes, one per trait position |

`WEAPON_TRAITS` is a single vector of `WEAPON_TRAIT_POSITIONS` (5) hashes. Neither the vector nor the unit holds a level for them. An unlocked position holds the hash of an empty string, which `keyOf` returns as undefined.

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
