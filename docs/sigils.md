# Sigils

A sigil is one unit in the sigil list plus a two-entry trait list.

## The sigil unit

Sigils occupy 5100 entities, `SIGIL_FIRST` (30000) to 35099. Every save has all 5100 units, a new game included. An id of 0 marks an empty entry.

| Attribute | Name            | Type   | Holds                                      |
| --------- | --------------- | ------ | ------------------------------------------ |
| 2702      | `SIGIL_ID`      | `uint` | Id the equip positions reference           |
| 2703      | `SIGIL_KEY`     | `uint` | `gem.Key` hash                             |
| 2704      | `SIGIL_LEVEL`   | `int`  | Level                                      |
| 2706      | `SIGIL_WORN_BY` | `uint` | Character key of the wearer, or empty hash |
| 2707      | `SIGIL_FLAGS`   | `uint` | Flags                                      |

Two more units sit at entity 0:

| Attribute | Name      | Type   | Holds                              |
| --------- | --------- | ------ | ---------------------------------- |
| 2701      | not named | `uint` | The highest id in use, 0 when none |
| 2708      | not named | `uint` | Bitmask, no meaning assigned       |

2708 is one value for the whole save, not a per-sigil field: it exists only at entity 0. It holds 0 in a new game and 7 (bits 0, 1 and 2) in the saves that hold sigils, the same in saves with different sigil counts. No save holds any other value, so the meaning of each bit is not known.

- Ids are unique. They are not dense: the highest is far above the number of sigils.
- Sigils in use can have empty units between them.
- A unit with id 0 has the empty hash in 2703 and 2706, and flags 0.
- A unit with an id always has a key that resolves in `gem`.
- 2704 is not reset on an empty unit. It holds 0 in a new game and can hold a non-zero level otherwise.

## Wearer

`SIGIL_WORN_BY` (2706) holds a character key on exactly the sigils that a character unit (`CHARACTER_FIRST`, 10000 on) lists in `EQUIP_SIGILS` (1403), and the key is that character's. Sigils listed only by loadout units (`LOADOUT_FIRST`, 20000 on) have the empty hash.

`EQUIP_SIGILS` can hold ids that no sigil unit has.

## Flags

2707 uses bits 0, 1, 2 and 4.

| Bit | Value | Name           | Set on                           |
| --- | ----- | -------------- | -------------------------------- |
| 0   | 1     | `SIGIL_LOCKED` | Locked sigils                    |
| 1   | 2     | `SIGIL_SEEN`   | Sigils whose new mark is cleared |
| 2   | 4     | not named      | Ids 16 and 17 only               |
| 3   | 8     | not named      | Unused, set on no sigil          |
| 4   | 16    | not named      | Ids 16 and 17 only               |

Bits 2 and 4 appear only together, in the value 23 (bits 0, 1, 2 and 4). The two sigils holding it are `GEEN_142_02` at id 16 and `GEEN_085_94` at id 17.

## Traits

A sigil's traits sit at `TRAIT_FIRST + (entity - SIGIL_FIRST) * TRAIT_STRIDE + index` (120000000 + …), with no holder base. Each entry holds `TRAIT_KEY` (1701) and `TRAIT_LEVEL` (1702).

- Every sigil unit has exactly two entries, index 0 and 1, empty units included.
- On an empty unit both entries hold the empty hash at level 1.
- On a sigil, both entries have the level in 2704.
- Index 0, the primary trait, is always `gem.SkillId1`.
- Index 1, the secondary trait, follows the `gem` row:

| `gem.SkillId2` | `SkillTypeLotIdForRandom2ndSkill` | Secondary trait             |
| -------------- | --------------------------------- | --------------------------- |
| empty          | -1                                | empty hash                  |
| empty          | a lot id                          | a skill                     |
| set            | -1                                | `SkillId2` or another skill |

The secondary can be the same skill as the primary.
