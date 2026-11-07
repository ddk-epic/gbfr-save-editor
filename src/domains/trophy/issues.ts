export type TrophyIssue =
  | { code: "trophySeenNotEarned"; key: number }
  | { code: "trophyNotInTable"; key: number };
