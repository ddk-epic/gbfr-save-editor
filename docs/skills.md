# Skills

A skill is one unit per `ability` row, shared by all characters. The archive calls skills abilities.

## The skill unit

Skills occupy entities 0-655. The `ability` rows fill them from 0, and the rest hold the empty hash with flags 0.

| Attribute | Name          | Type   | Holds         |
| --------- | ------------- | ------ | ------------- |
| 3903      | `SKILL_KEY`   | `uint` | `ability.Key` |
| 3904      | `SKILL_FLAGS` | `uint` | Flags         |

### Flags

| Bit | Value | Name             | Set on                                                                      |
| --- | ----- | ---------------- | --------------------------------------------------------------------------- |
| 0   | 1     | `SKILL_ACQUIRED` | Acquired: granted by a taken mastery node, or the character's default skill |
| 3   | 8     | `SKILL_SEEN`     | Skills whose new mark is cleared                                            |

- 3904 takes the values 0, 1 and 9. Bit 3 is only set with bit 0.
- A mastery node grants the skill in its `limit_bonus.AbilityId`. Every taken node's skill has bit 0.
- The default skill is the character's row with `ability.DefaultSkill` 1. It has bit 0 from a new game on, whether or not the character has joined.
- Bit 0 does not follow joining. A character that joins with mastery nodes already taken has those skills acquired before joining.
- A skill at 1 shows the new mark in the character's skill list.
- Guest characters' default skills start at 0 and are acquired in play.
- `AB_PL2000_05`, the default skill of the second form of Id, stays at 0.

## Equipped skills

`EQUIP_SKILLS` (1404, `uint[4]`) holds the `ability.Key` of each of the four skill positions. It sits on a character's own entity, on a loadout and on a party set member, next to the equipment. See [characters](characters.md).

## Open

- Gallanza has every skill acquired before joining, with no mastery node taken. What grants them is not known.
