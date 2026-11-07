export type OverMasteryIssue = {
  code: "overMasteryOverMax";
  character: string;
  entity: number;
  level: number;
};

/** An Over Mastery level that is not a single bit. */
export type OverMasteryFormatIssue = {
  code: "overMasteryLevel";
  entity: number;
  bits: number;
};
