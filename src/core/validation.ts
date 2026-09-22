import type { SaveFormatIssue } from "./errors";

/**
 * `reject`: the reading cannot be trusted, or the game would refuse the save.
 * `warning`: the save reads, but something is off, usually `src/data` behind
 * the game.
 */
export type Severity = "reject" | "warning";

/** A claim every save the game writes holds, found broken. */
export type ValidationIssue =
  /** A fixed header field holds another value. */
  | { code: "headerLayout"; field: string; expected: number; actual: number }
  /** SlotData running past the save's fixed file size. */
  | { code: "slotDataPastFileSize"; end: number; fileSize: number }
  /** A version field the reader was not written against. */
  | {
      code: "unexpectedVersion";
      what: string;
      expected: number | undefined;
      actual: number | undefined;
    }
  /** A SlotData checksum of 0. */
  | { code: "zeroChecksum"; index: number }
  /** The save holds a different number of rows than the game table. */
  | { code: "tableCount"; table: string; held: number; expected: number }
  | {
      code: "masteryOverTotal";
      character: string;
      section: string;
      taken: number;
      total: number;
    }
  | {
      code: "masterTraitPool";
      character: string;
      rank: string;
      chosen: number;
      pool: number;
    }
  | {
      code: "overMasteryOverMax";
      character: string;
      entity: number;
      level: number;
    }
  | { code: "duplicateFateEpisode"; character: string; key: string }
  | { code: "negativeResonancePoints"; points: number }
  /** A Resonance node taken while the root is not. */
  | { code: "resonanceRootNotTaken" }
  | { code: "auraSeenNotObtained"; key: string }
  | { code: "auraNotInTable"; key: string }
  | { code: "negativeItemCount"; key: string; count: number }
  | { code: "wishListTooLong"; count: number; max: number }
  | { code: "duplicateWishListItem"; key: string }
  | { code: "wishListNotTreasure"; key: string }
  /** An item list naming an item the inventory does not hold. */
  | { code: "itemNotHeld"; list: string; key: string }
  | {
      code: "tooManyTraits";
      holder: string;
      id: number;
      count: number;
      max: number;
    }
  | { code: "traitsNotDescending"; holder: string; id: number }
  | { code: "curioSerialOrder"; entity: number }
  | { code: "duplicateJournalRow"; list: string; key: string }
  | { code: "trophySeenNotEarned"; key: number }
  | { code: "trophyNotInTable"; key: number }
  | { code: "duplicateQuest"; list: string; id: string }
  | { code: "completedNotAccepted"; id: string }
  | { code: "clearDateWithoutClear"; id: string }
  | { code: "clearDateOutOfRange"; id: string; date: string }
  /** Counter quest clears that do not add up to the profile's count. */
  | { code: "questClearsMismatch"; sum: number; profile: number }
  | { code: "unknownCharacter"; where: string; key: string };

export type ValidationCode = ValidationIssue["code"];

/** A problem found in a save, format error or broken claim, and how much it matters. */
export type SaveIssue = (SaveFormatIssue | ValidationIssue) & {
  severity: Severity;
};

export const reject = (issue: ValidationIssue): SaveIssue => ({
  severity: "reject",
  ...issue,
});

export const warning = (issue: ValidationIssue): SaveIssue => ({
  severity: "warning",
  ...issue,
});

/** A key listed twice in `keys`, once per extra occurrence. */
export function duplicates<T>(keys: readonly T[]): T[] {
  const seen = new Set<T>();
  return keys.filter((key) => seen.has(key) || !seen.add(key));
}
