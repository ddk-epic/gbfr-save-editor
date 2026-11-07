export type WrightstoneIssue =
  | {
      code: "tooManyTraits";
      holder: string;
      id: number;
      count: number;
      max: number;
    }
  | { code: "traitsNotDescending"; holder: string; id: number };
