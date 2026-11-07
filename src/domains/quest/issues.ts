export type QuestIssue =
  | { code: "duplicateQuest"; list: string; id: string }
  | { code: "completedNotAccepted"; id: string }
  | { code: "clearDateWithoutClear"; id: string }
  | { code: "clearDateOutOfRange"; id: string; date: string };
