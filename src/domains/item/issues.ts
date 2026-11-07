import type { TableCountIssue } from "../../core/validation";

export type ItemIssue =
  | TableCountIssue
  | { code: "negativeItemCount"; key: string; count: number }
  | { code: "wishListTooLong"; count: number; max: number }
  | { code: "duplicateWishListItem"; key: string }
  | { code: "wishListNotTreasure"; key: string };
