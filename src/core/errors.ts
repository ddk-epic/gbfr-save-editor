import type { ValueType } from "./save-data-binary";

export type SaveFormatIssue =
  /** A read of `size` bytes at `at` falls outside `length`. `what` names the part, such as `SlotData` or `u32`. */
  | {
      code: "outOfBounds";
      what: string;
      at: number;
      size: number;
      length: number;
    }
  /** A u64 offset or size exceeds the safe integer range. */
  | { code: "tooLarge"; what: string; value: bigint }
  /** SlotData is smaller than its footer. */
  | { code: "noFooterRoom"; slotDataSize: number }
  /** The footer's checksum range does not end where the footer starts. */
  | {
      code: "footerMisaligned";
      checksumOffset: number;
      checksumBytes: number;
      footerAt: number;
    }
  /** A SaveDataBinary too short to hold its root offset. */
  | { code: "flatBufferTooShort" }
  /** One attribute stored under two value types. */
  | {
      code: "mixedValueType";
      attribute: number;
      first: ValueType;
      second: ValueType;
    }
  /** One attribute and entity stored twice. */
  | { code: "duplicateUnit"; attribute: number; entity: number }
  /** A unit read as a value type it is not stored as. */
  | {
      code: "wrongValueType";
      attribute: number;
      expected: ValueType;
      actual: ValueType;
    }
  /** A mastery bit set on a node index the table leaves unused. */
  | { code: "unusedMasteryBit"; entity: number; bit: number }
  /** An over-mastery level that is not a single bit. */
  | { code: "overMasteryLevel"; entity: number; bits: number };

export type SaveFormatCode = SaveFormatIssue["code"];

/** The code and its parameters, e.g. `outOfBounds what=header at=0x0 size=52 length=0x10`. */
function summarize({ code, ...params }: SaveFormatIssue): string {
  const fields = Object.entries(params).map(
    ([name, value]) =>
      `${name}=${typeof value === "bigint" ? `0x${value.toString(16)}` : value}`,
  );
  return [code, ...fields].join(" ");
}

/** Thrown when save bytes do not match the expected layout. */
export class SaveFormatError extends Error {
  override name = "SaveFormatError";
  readonly issue: SaveFormatIssue;

  constructor(issue: SaveFormatIssue) {
    super(summarize(issue));
    this.issue = issue;
  }

  get code(): SaveFormatCode {
    return this.issue.code;
  }
}
