import type { Context } from "./context";
import { emitSortOrder } from "./sort-order";

// Inventory order: items by item.SortOrder.
export function genItem(ctx: Context) {
  emitSortOrder(ctx, "item", "ITEM_SORT_ORDER", "item", "SortOrder");
}
