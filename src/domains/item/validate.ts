import { ITEM_KEYS } from "../../data/items";
import {
  duplicates,
  reject,
  warning,
  type SaveIssue,
} from "../../core/validation";
import { itemTab } from "./read";

export const WISH_LIST_MAX = 20;

export function validateItems(
  items: Map<string, number>,
  wishList: string[],
): SaveIssue[] {
  const issues: SaveIssue[] = [];
  // The save keeps a unit for every item row, held or not.
  const expected = Object.keys(ITEM_KEYS).length;
  if (items.size !== expected)
    issues.push(
      warning({
        code: "tableCount",
        table: "item",
        held: items.size,
        expected,
      }),
    );
  for (const [key, count] of items)
    if (count < 0)
      issues.push(reject({ code: "negativeItemCount", key, count }));
  if (wishList.length > WISH_LIST_MAX)
    issues.push(
      reject({
        code: "wishListTooLong",
        count: wishList.length,
        max: WISH_LIST_MAX,
      }),
    );
  for (const key of duplicates(wishList))
    issues.push(reject({ code: "duplicateWishListItem", key }));
  // Only materials can be wished for.
  for (const key of wishList)
    if (itemTab(key) !== "treasures")
      issues.push(reject({ code: "wishListNotTreasure", key }));
  return issues;
}
