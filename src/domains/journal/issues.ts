import type { TableCountIssue } from "../../core/validation";

export type JournalIssue =
  TableCountIssue | { code: "duplicateJournalRow"; list: string; key: string };
