import type { TableCountIssue } from "@gbfr/core";

export type JournalIssue =
  TableCountIssue | { code: "duplicateJournalRow"; list: string; key: string };
