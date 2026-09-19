# Master traits

A master trait cell is one entry of a character's mastery block.

## The cell

The master trait cells follow the mastery nodes: 99 `skillboard_effect.Key` entries, 111 for the captains, then empty ids.

| Attribute | Name           | Type   | Holds                                    |
| --------- | -------------- | ------ | ---------------------------------------- |
| 1601      | `UNLOCK_KEY`   | `uint` | `skillboard_effect.Key`                  |
| 1602      | `UNLOCK_VALUE` | `int`  | 1 when the cell is selected, 0 otherwise |

## Board layout

Cells join to `skillboard_layout` through `SkillboardEffectOrUiId`, which gives the style (`SkillboardCategoryId`), the rank (`SkillboardGroupId`) and the perk flag (`Unk25` = 100). Within a style the cells run in `skillboard_layout.Unk30` order: the three perks, then the ordinary cells rank by rank.

| `Unk30`     | Cells                  |
| ----------- | ---------------------- |
| 0, 100, 200 | Insight, Essence, Crux |
| +0 to +2    | Perks                  |
| +10         | Rank 1                 |
| +20         | Rank 2                 |
| +30         | Rank 3                 |
| +50         | EX                     |

## Text

A trait's text is `skillboard_effect.Unk19`. `{n}` in it is `Value(n % 10 + 1)` of action part `n / 10` in `skillboard_effect_action_parts`, through `SkillboardEffectActionPartsId1` to 3. Stun Power parts (`SubType` 8, `MainType` 8) hold 1/10 of the displayed value.
