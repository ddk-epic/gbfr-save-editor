export type MasteryIssue = {
  code: "masteryOverTotal";
  character: string;
  section: string;
  taken: number;
  total: number;
};

/** A mastery bit set on a node index the table leaves unused. */
export type MasteryFormatIssue = {
  code: "unusedMasteryBit";
  entity: number;
  bit: number;
};
