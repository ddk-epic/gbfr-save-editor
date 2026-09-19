# Abilities

An ability is one unit per `ability` row, shared by all characters.

## The ability unit

Abilities occupy entities 0-655. The `ability` rows fill them from 0, and the rest hold the empty hash with flags 0.

| Attribute | Name            | Type   | Holds         |
| --------- | --------------- | ------ | ------------- |
| 3903      | `ABILITY_KEY`   | `uint` | `ability.Key` |
| 3904      | `ABILITY_FLAGS` | `uint` | Flags         |

### Flags

| Bit | Value | Name               | Set on                                                                        |
| --- | ----- | ------------------ | ----------------------------------------------------------------------------- |
| 0   | 1     | `ABILITY_ACQUIRED` | Acquired: granted by a taken mastery node, or the character's default ability |
| 3   | 8     | `ABILITY_SEEN`     | Abilities whose new mark is cleared                                           |

- 3904 takes the values 0, 1 and 9. Bit 3 is only set with bit 0.
- A mastery node grants the ability in its `limit_bonus.AbilityId`. Every taken node's ability has bit 0.
- The default ability is the character's row with `ability.DefaultSkill` 1. It has bit 0 from a new game on, whether or not the character has joined.
- Bit 0 does not follow joining. A character that joins with mastery nodes already taken has those abilities acquired before joining.
- An ability at 1 shows the new mark in the character's ability list.
- Guest characters' default abilities start at 0 and are acquired in play.
- `AB_PL2000_05`, the default ability of the second form of Id, stays at 0.

## Open

- Gallanza has every ability acquired before joining, with no mastery node taken. What grants them is not known.
