import { describe, expect, it } from "vitest";
import {
  TROPHIES,
  TROPHIES_EARNED_IN_RANGE,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  TROPHY_SEEN,
  readTrophies,
  type Trophy,
  validateTrophies,
} from "@gbfr/trophy";
import {
  addProgress,
  earnTrophy,
  raiseProgress,
  setProgress,
} from "@gbfr/trophy/edit";
import { apply } from "../helpers";
import { SaveSession } from "@gbfr/core/session";
import { SAVE_ENTITY } from "@gbfr/core";
import { fixtureFile, unitStore } from "gbfr-save-editor/testing";

describe("readTrophies", () => {
  const [first, second] = TROPHIES.map(([key]) => key);
  const unknown = Math.max(...TROPHIES.map(([key]) => key)) + 1;
  const bits = (...keys: number[]) =>
    Array.from({ length: unknown + 1 }, (_, key) => keys.includes(key));

  it("lists every badge in table order, earned or not", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [
        [TROPHY_EARNED, bits(second!)],
        [TROPHY_SEEN, bits(second!)],
      ],
    });
    const trophies = readTrophies(units);
    expect(trophies.map((t) => t.key)).toEqual(TROPHIES.map(([key]) => key));
    expect(trophies.filter((t) => t.earned).map((t) => t.key)).toEqual([
      second,
    ]);
    expect(trophies.find((t) => t.key === first)!.earned).toBe(false);
  });

  it("puts an earned badge the table lacks last, under other", () => {
    const units = unitStore({
      [SAVE_ENTITY]: [[TROPHY_EARNED, bits(unknown)]],
    });
    expect(readTrophies(units).at(-1)).toEqual({
      key: unknown,
      tab: "other",
      dlc: undefined,
      quantity: undefined,
      earned: true,
      seen: false,
    });
  });
});

describe("validateTrophies", () => {
  const trophy = (fields: Partial<Trophy>): Trophy => ({
    key: 10,
    tab: "story",
    dlc: false,
    quantity: 1,
    earned: true,
    seen: true,
    ...fields,
  });

  it("passes a seen trophy that is earned", () => {
    expect(validateTrophies([trophy({})])).toEqual([]);
  });

  it("warns on a trophy seen but not earned", () => {
    expect(validateTrophies([trophy({ earned: false })])).toEqual([
      { severity: "warning", code: "trophySeenNotEarned", key: 10 },
    ]);
  });

  it("warns on an earned trophy the badge table lacks", () => {
    expect(validateTrophies([trophy({ dlc: undefined })])).toEqual([
      { severity: "warning", code: "trophyNotInTable", key: 10 },
    ]);
  });
});

describe("trophy edits", () => {
  const open = () =>
    SaveSession.open(
      fixtureFile({
        [SAVE_ENTITY]: [
          [TROPHY_EARNED, Array<boolean>(1500).fill(false)],
          [TROPHY_PROGRESS, Array<bigint>(1200).fill(0n)],
        ],
      }),
    );
  const at = (session: SaveSession) =>
    session.save.slotData.units.of(SAVE_ENTITY);

  it("earns a trophy once and reports whether it was new", () => {
    const session = open();
    expect(apply(session, (draft) => earnTrophy(draft, 5))).toBe(true);
    expect(apply(session, (draft) => earnTrophy(draft, 5))).toBe(false);
    expect(at(session).get(TROPHY_EARNED)[5]).toBe(true);
    expect(at(session).get(TROPHY_PROGRESS)[TROPHIES_EARNED_IN_RANGE]).toBe(0n);
  });

  it("counts a trophy in the counted range once", () => {
    const session = open();
    apply(session, (draft) => {
      earnTrophy(draft, 1400);
      earnTrophy(draft, 1400);
      earnTrophy(draft, 1401);
    });
    expect(at(session).get(TROPHY_PROGRESS)[TROPHIES_EARNED_IN_RANGE]).toBe(2n);
  });

  it("adds, sets and raises a count, each seeing the one before", () => {
    const session = open();
    apply(session, (draft) => {
      addProgress(draft, 30, 2);
      addProgress(draft, 30, 3);
      setProgress(draft, 31, 7n);
      raiseProgress(draft, 31, 4n);
      raiseProgress(draft, 32, 4n);
    });
    const progress = at(session).get(TROPHY_PROGRESS);
    expect([progress[30], progress[31], progress[32]]).toEqual([5n, 7n, 4n]);
  });
});
