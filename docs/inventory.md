# Inventory

The inventory spans six unit lists in SlotData. `readInventory` in `src/domain/inventory.ts` reads all of them. The facts below hold in every local save tested, from a new game to endgame.

| List         | Attribute of the key | Entities    | Units | Empty entry           |
| ------------ | -------------------- | ----------- | ----- | --------------------- |
| Items        | 1801                 | 0-499       | 500   | key is the empty hash |
| Curios       | 2002                 | 0-998       | 999   | key is the empty hash |
| Summons      | 1456                 | 0-999       | 1000  | summon id 0           |
| Sigils       | 2702                 | 30000-35099 | 5100  | slot id 0             |
| Weapons      | 2802                 | 40000-40255 | 256   | slot id 0             |
| Wrightstones | 2102                 | 50000-54999 | 5000  | key is the empty hash |

Every list has its full unit count in every save, a new game included. Curios, summons and weapons in use fill their list from the first unit with no gaps. Sigils and wrightstones in use can have empty units between them.

## Currencies

Rupies are 1104 and mastery points 1112, each an `int` at entity 0. The item rows Rupie, Mastery Point, Conflux Point and Resonance Point (`ItemCategoryId` 10) hold a count of 0.

## Items

| Attribute | Type   | Holds                      |
| --------- | ------ | -------------------------- |
| 1801      | `uint` | `item.Key` hash, one value |
| 1802      | `int`  | Count                      |
| 1803      | `uint` | Flags                      |

All three attributes cover entities 0-499.

- Units 0-447 hold the 448 `item` rows, each row exactly once.
- Units 448-499 hold the empty hash, with count 0 and flags 0.
- A row never held still has its unit, with count 0.

Unit order does not follow `item.SortOrder`, and it is not the same in every save. The unit a row sits at is not a stable key; the `item.Key` is.

### Flags

1803 uses bits 0, 2, 3 and 5. No other bit is set.

| Bit | Value | Name              | Set on                                 |
| --- | ----- | ----------------- | -------------------------------------- |
| 0   | 1     | `ITEM_WISH_LIST`  | Wish list items                        |
| 1   | 2     | not named         | Unused, set on no item                 |
| 2   | 4     | `ITEM_FIELD_NOTE` | Items with a Field Notes Treasure page |
| 3   | 8     | `ITEM_SEEN`       | Items whose new mark is cleared        |
| 4   | 16    | not named         | Unused, set on no item                 |
| 5   | 32    | not named         | Key items (`ItemCategoryId` 14) only   |

- Every item with a count above 0 has bit 2.
- Every item with bit 3 has bit 2.
- Every item with bit 0 has bit 3 and sits in the treasures tab. At most 20 items have bit 0.
- Held potions (`ItemCategoryId` 5), wrightstone items (6) and the Gold Badge Ticket (13) never have bit 3. At a count of 0 their flags are 0 or 4.

### Tabs

The item menu tab follows `item.SortOrder`. `itemTab` derives it. The ranges and row counts come from the `item` table.

| Tab       | SortOrder | Rows | First              | Last                   |
| --------- | --------- | ---- | ------------------ | ---------------------- |
| Treasures | 100-922   | 255  | Fortitude Shard    | Supreme Weapon Essence |
| Key items | 2000-2134 | 62   | Life Link          | Dark Wee Pincer        |
| Neither   | 3000-3073 | 74   | wrightstone items  |                        |
| Neither   | 99779 on  | 57   | `IsVisible` 0 rows |                        |

Every save holds a unit for each of the 74 wrightstone item rows, a new game included, whether or not the player has a stone of that key.

### Fixed counts

- The 57 rows with `IsVisible` 0 have count 0 and flags 0.
- `ITEM_13_0004`, `ITEM_33_0001` and `ITEM_33_0004` have no `ItemName`, count 0 and flags 0.
- The eleven `ITEM_50_*` rows, Windcrest to Desert Oil and the `ITEM_50_0011` Evergreen Crystal Fragment, have count 0. A save holding an Evergreen Crystal Fragment holds `ITEM_70_0011`.
- Life Link, Lyria's Journal and Sky Map Piece have count 1.
- Counts are never negative. They stay within `item_category.MaxHoldable`, with Wee Pincer (`ITEM_60_0000`) as the exception: its category allows 1, and the saves that hold it have 45.

## Curios

A curio's tier is its `item.Key`, `ITEM_19_0001` to `ITEM_19_0004`, in 2002. Its reward sits at entity `curio unit * 100 + entry`, entries 0-4.

Every non-empty 2002 key is one of the four tiers. The Curio item rows do not follow the tiers. `ITEM_19_0001` holds the number of curios in the list, all tiers together. `ITEM_19_0002`, `ITEM_19_0003` and `ITEM_19_0004` hold 0.

## Wrightstones

- A stone's key is an `item` row of `ItemCategoryId` 6, a wrightstone item.
- A stone has 0 to 3 traits in its `TRAIT_OWNER_WRIGHTSTONE` list.
- A wrightstone item's count equals the number of inventory stones with that key. `ITEM_26_0131` is the exception, one below the number of stones in every save that holds it.
- Stones applied to a weapon have no inventory unit and are not in the count.

`weapons.md` covers the trait lists and applied stones.

## Sigils, weapons and summons

Sigil slot ids are not dense: the highest slot id in use is far above the number of sigils. Equipment and loadout units reference sigils and weapons by slot id, and the summon slots at 1451 reference summons by summon id.

`sigils.md`, `weapons.md` and `summons.md` cover each unit.
