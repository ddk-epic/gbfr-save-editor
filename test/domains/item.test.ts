import { describe, expect, it } from "vitest";
import { ITEM_KEYS } from "../../src/data/items";
import { itemTab } from "../../src/domains/item/read";
import { validateItems } from "../../src/domains/item/validate";

// Every item row, as the save holds them.
const KEYS = Object.values(ITEM_KEYS);
const TREASURES = KEYS.filter((key) => itemTab(key) === "treasures");
const KEY_ITEM = KEYS.find((key) => itemTab(key) === "keyItems")!;
const allItems = () => new Map(KEYS.map((key) => [key, 1]));

describe("itemTab", () => {
  // Rows with a menu of their own sort into no item tab.
  it("sorts 62 key items out of the list, the rows at SortOrder 2000-2134", () => {
    expect(KEYS.filter((key) => itemTab(key) === "keyItems")).toHaveLength(62);
  });
});

describe("validateItems", () => {
  it("passes every item row with a short wish list of treasures", () => {
    expect(validateItems(allItems(), TREASURES.slice(0, 20))).toEqual([]);
  });

  it("warns on an item count off the table", () => {
    const items = allItems();
    items.delete(KEYS[0]!);
    expect(validateItems(items, [])).toEqual([
      {
        severity: "warning",
        code: "tableCount",
        table: "item",
        held: KEYS.length - 1,
        expected: KEYS.length,
      },
    ]);
  });

  it("rejects a negative count", () => {
    const items = allItems().set(TREASURES[0]!, -1);
    expect(validateItems(items, [])).toEqual([
      {
        severity: "reject",
        code: "negativeItemCount",
        key: TREASURES[0],
        count: -1,
      },
    ]);
  });

  it("rejects a wish list too long, with repeats, or naming a non-material", () => {
    const [a] = TREASURES;
    const wishList = [...TREASURES.slice(0, 20), a!, KEY_ITEM];
    expect(validateItems(allItems(), wishList)).toEqual([
      { severity: "reject", code: "wishListTooLong", count: 22, max: 20 },
      { severity: "reject", code: "duplicateWishListItem", key: a },
      { severity: "reject", code: "wishListNotTreasure", key: KEY_ITEM },
    ]);
  });
});
