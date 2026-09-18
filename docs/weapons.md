# Weapons and wrightstones

A weapon carries two separate trait lists. Its own five trait slots sit on the weapon unit. The traits of the wrightstone applied to it live in a trait list of their own. `readWeapons` in `src/domain/inventory.ts` reads both.

## The weapon unit

Weapons occupy 256 entities, `UNIT.WEAPON` (40000) to 40255. `WEAPON_SLOT_ID` (2802) gives the slot the equipment units reference. A slot of 0 or an unresolved `WEAPON_KEY` (2803) marks an empty entry.

| Attribute | Name                   | Holds                                        |
| --------- | ---------------------- | -------------------------------------------- |
| 2802      | `WEAPON_SLOT_ID`       | Slot the equipment units point at            |
| 2803      | `WEAPON_KEY`           | `weapon.Key` hash                            |
| 2804      | `WEAPON_XP`            | Experience                                   |
| 2805      | `WEAPON_UNCAP`         | Uncap level                                  |
| 2806      | `WEAPON_PLUS`          | Plus value                                   |
| 2807      | `WEAPON_AWAKENING`     | Awakening level                              |
| 2813      | `WEAPON_QUESTS_USED`   | Times taken into a quest                     |
| 2814      | `WEAPON_APPEARANCE`    | `weapon.Key` of the chosen look              |
| 2815      | `WEAPON_FLAGS`         | `WEAPON_SEEN` 64, `WEAPON_AWAKENING_SEEN` 16 |
| 2816      | `WEAPON_WRIGHTSTONE`   | `item.Key` of the applied stone              |
| 2817      | `WEAPON_TRANSCENDENCE` | Transcendence stage                          |
| 2818      | `WEAPON_TRAITS`        | Five `skill.Key` hashes, one per trait slot  |

`WEAPON_TRAITS` is a single vector of `WEAPON_TRAIT_SLOTS` (5) hashes. Neither the vector nor the unit holds a level for them. An unlocked slot holds the hash of an empty string, which `keyOf` returns as undefined.

## Trait lists

Traits with levels live in their own units at `UNIT.TRAIT + owner * 100 + index` (120000000 + …). Each index holds `TRAIT_KEY` (1701, a `skill.Key` hash) and `TRAIT_LEVEL` (1702, an int). `readTraits` walks the indices until a `TRAIT_KEY` is missing.

The owner number keeps the lists apart.

| Owner base                         | Value  | List                               |
| ---------------------------------- | ------ | ---------------------------------- |
| `UNIT.TRAIT_OWNER_WEAPON`          | 100000 | Traits of a weapon's applied stone |
| `UNIT.TRAIT_OWNER_WRIGHTSTONE`     | 200000 | Traits of an inventory stone       |
| (none, sigils use their own index) | 0      | A sigil's primary and secondary    |

The owner is the entry's index within its inventory, so a weapon at entity 40007 reads owner `100000 + 7` and a wrightstone at 50003 reads owner `200000 + 3`.

## Trait levels

Levels sit on the trait, not on the stone. Every level comes from the `TRAIT_LEVEL` beside the trait's own key.

| Attribute | Name          | Type   | Holds            |
| --------- | ------------- | ------ | ---------------- |
| 1701      | `TRAIT_KEY`   | `uint` | `skill.Key` hash |
| 1702      | `TRAIT_LEVEL` | `int`  | Trait level      |

The wrightstone unit holds no level data. Wrightstones occupy 5000 entities, `UNIT.WRIGHTSTONE` (50000) to 54999.

| Attribute | Name                       | Type   | Holds                                                               |
| --------- | -------------------------- | ------ | ------------------------------------------------------------------- |
| 2101      | `WRIGHTSTONE_LAST_SLOT_ID` | `uint` | At entity 0 only: the highest slot id in use, 0 when none           |
| 2102      | `WRIGHTSTONE_KEY`          | `uint` | `item.Key` of the stone tier, such as Vitality or Dread Wrightstone |
| 2103      | `WRIGHTSTONE_SLOT_ID`      | `uint` | Slot id                                                             |
| 2104      | `WRIGHTSTONE_LOCKED`       | `bool` | Locked                                                              |
| 2105      | `WRIGHTSTONE_FLAGS`        | `uint` | `WRIGHTSTONE_SEEN` 2                                                |

`Wrightstone.traits` keeps save order, which is the main trait followed by the two subs.

## Applied stones

An applied stone has no inventory unit. Applying a wrightstone moves its traits onto the weapon. The weapon keeps the stone's `item.Key` in `WEAPON_WRIGHTSTONE`, and the traits become the weapon's `TRAIT_OWNER_WEAPON` list. Nothing remains under `UNIT.WRIGHTSTONE` for it. `readWeapons` rebuilds the `Wrightstone` object from those two halves, so `weapon.wrightstone.traits` and `stone.traits` from `inventory.wrightstones` have the same shape though they come from different owners.
