# Conflux

Conflux is the endless mode added in the Endless Ragnarok DLC. The save holds its Resonance tree, its aura collection and a few unnamed state values. `readConflux` in `src/domain/conflux.ts` reads the points, the tree and the collection. The tables behind it are the `endlessmode_*` tables of the archive.

## Resonance points

`USER_RESONANCE_POINTS` (1116) at entity 0 holds the Resonance points, the currency of the Resonance tree. `user-and-system.md` covers the user data.

## Resonance tree

The Resonance tree shares its attributes with the character progress units and is stored the same way as masteries. It sits at entities 0-199.

| Attribute | Name             | Type   | Holds                                       |
| --------- | ---------------- | ------ | ------------------------------------------- |
| 1601      | `PROGRESS_KEY`   | `uint` | Bonus of the node, a `limit_bonus.Key` hash |
| 1602      | `PROGRESS_VALUE` | `int`  | Bitmask of the taken nodes with that bonus  |

- `endlessmode_tree` has 62 rows, one per node. Several nodes can grant the same bonus, so the save holds 58 entries at units 0-57, one per distinct `endlessmode_tree.Unk19`, in the order each first appears in the table. Units 58-199 hold the empty hash and 0.
- Every save has all 58 entries, a new game included.
- Bit n of 1602 is the node with that bonus at `endlessmode_tree.Unk24` n, as `LimitBonusParamIndex` works for masteries.
- The game's tree completion probably counts only the first 42 rows. The other 20 rows carry `Unk35` 151.

### The tree table

`endlessmode_tree` columns keep the extractor's names.

| Column        | Holds                                          |
| ------------- | ---------------------------------------------- |
| `Unk1`-`Unk3` | Parent node ids, empty on the root             |
| `Unk19`       | Bonus, a `limit_bonus.Key`                     |
| `Unk20`       | Node id                                        |
| `Unk24`       | Index among the nodes with the same bonus, 0-2 |
| `Unk25`       | Cost in Resonance points                       |
| `Unk30`       | Position                                       |
| `Unk35`       | 0 or 151                                       |

A bonus's name and description are the text keys `limit_bonus.NodeTitle` and `limit_bonus.NodeDescription`, `TXT_EDL_*`.

## Aura collection

Auras occupy 300 entities, 0 to 299. Every save holds all 236 `endlessmode_buff` rows at units 0-235, a new game included, but not in table order. Units 236-299 hold the empty hash with flags 0.

| Attribute | Name                 | Type   | Holds                          |
| --------- | -------------------- | ------ | ------------------------------ |
| 9601      | `CONFLUX_AURA_KEY`   | `uint` | `endlessmode_buff.Unk105` hash |
| 9602      | `CONFLUX_AURA_FLAGS` | `uint` | Flags                          |

The first digit of `endlessmode_buff.Unk1` is the aura's category, and `endlessmode_buff_category` has one row per category.

| Digit | Category      | Text key                         | Auras |
| ----- | ------------- | -------------------------------- | ----- |
| 0     | Vitality      | `TXT_KKTN_BFCHIC_TYPE_BREATH`    | 30    |
| 1     | Sequestration | `TXT_KKTN_BFCHIC_TYPE_ISOLATION` | 30    |
| 2     | Fortification | `TXT_KKTN_BFCHIC_TYPE_TUTELARY`  | 30    |
| 3     | Dread         | `TXT_KKTN_BFCHIC_TYPE_AWE`       | 30    |
| 4     | Destruction   | `TXT_KKTN_BFCHIC_TYPE_DESTROY`   | 30    |
| 5     | Warfare       | `TXT_KKTN_BFCHIC_TYPE_CONFLICT`  | 30    |
| 6     | Calamity      | `TXT_KKTN_BFCHIC_TYPE_DISASTER`  | 16    |
| 7     | Salvation     | `TXT_KKTN_BFCHIC_TYPE_RESCUE`    | 16    |
| 8     | Chaos         | `TXT_KKTN_BFCHIC_TYPE_CHAOS`     | 24    |

The collection shows the obtained auras over all auras, rounded down, for each category and overall. Calamity and Salvation share one entry.

### Flags

9602 uses bits 0 and 1.

| Bit | Value | Name                    | Set on                          |
| --- | ----- | ----------------------- | ------------------------------- |
| 0   | 1     | `CONFLUX_AURA_OBTAINED` | Obtained auras                  |
| 1   | 2     | `CONFLUX_AURA_SEEN`     | Auras whose new mark is cleared |

Every aura with bit 1 has bit 0.

## Other units

| Attribute | Name      | Type     | Holds                                |
| --------- | --------- | -------- | ------------------------------------ |
| 9501      | not named | `uint`   | Hash-like                            |
| 9502      | not named | `int`    |                                      |
| 9503      | not named | `int`    |                                      |
| 9504      | not named | `int`    |                                      |
| 9505      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9506      | not named | `short`  |                                      |
| 9507      | not named | `ubyte`  |                                      |
| 9508      | not named | `bool`   |                                      |
| 9509      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9510      | not named | `ulong`  | Probably a Unix time in milliseconds |
| 9511      | not named | `int[2]` |                                      |

Each has a single unit at entity 0.
