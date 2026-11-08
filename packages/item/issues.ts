import type { TableCountIssue } from "@gbfr/core";

export type ItemIssue =
  | TableCountIssue
  | { code: "negativeItemCount"; key: string; count: number }
  | { code: "wishListTooLong"; count: number; max: number }
  | { code: "duplicateWishListItem"; key: string }
  | { code: "wishListNotTreasure"; key: string };
