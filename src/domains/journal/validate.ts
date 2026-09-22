import { duplicates, warning, type SaveIssue } from "../../core/validation";
import type { JournalEntry } from "./read";

/** One journal list against its key table. The save keeps a row for every table row, unlocked or not. */
export function validateJournalList(
  list: string,
  entries: JournalEntry[],
  keys: Readonly<Record<number, string>>,
): SaveIssue[] {
  const issues = duplicates(entries.map((entry) => entry.key)).map((key) =>
    warning({ code: "duplicateJournalRow", list, key }),
  );
  const expected = Object.keys(keys).length;
  if (entries.length !== expected)
    issues.push(
      warning({
        code: "tableCount",
        table: list,
        held: entries.length,
        expected,
      }),
    );
  return issues;
}
