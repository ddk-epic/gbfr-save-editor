export type ConfluxIssue =
  | { code: "negativeResonancePoints"; points: number }
  /** A Resonance node taken while the root is not. */
  | { code: "resonanceRootNotTaken" }
  | { code: "auraSeenNotObtained"; key: string }
  | { code: "auraNotInTable"; key: string };
