import type { Context } from "./context";
import { emitSortOrder } from "./sort-order";

// Inventory order: sigils by trait's skill.InventorySortOrder.
export function genTrait(ctx: Context) {
  emitSortOrder(
    ctx,
    "trait",
    "TRAIT_INVENTORY_SORT_ORDER",
    "skill",
    "InventorySortOrder",
  );
}
