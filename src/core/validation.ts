/** `reject`: untrusted reading or a save the game refuses; `warning`: readable but off. */
export type Severity = "reject" | "warning";

/** A problem found in a save, named by its code. */
export interface Issue {
  readonly code: string;
}

/** An issue and how much it matters. */
export type Graded<I extends Issue> = I & { severity: Severity };

/** The save holds a different number of rows than the game table. */
export type TableCountIssue = {
  code: "tableCount";
  table: string;
  held: number;
  expected: number;
};

export const reject = <const I extends Issue>(issue: I): Graded<I> => ({
  severity: "reject",
  ...issue,
});

export const warning = <const I extends Issue>(issue: I): Graded<I> => ({
  severity: "warning",
  ...issue,
});

/** A key listed twice in `keys`, once per extra occurrence. */
export function duplicates<T>(keys: readonly T[]): T[] {
  const seen = new Set<T>();
  return keys.filter((key) => seen.has(key) || !seen.add(key));
}
