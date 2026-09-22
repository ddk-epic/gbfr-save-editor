import { describe, expect, it } from "vitest";
import { CONFLUX_AURAS, CONFLUX_TREE } from "../../src/data/conflux";
import {
  CONFLUX_AURA_FLAGS,
  CONFLUX_AURA_KEY,
} from "../../src/domains/conflux/attributes";
import {
  readConflux,
  type Aura,
  type Conflux,
  type ResonanceNode,
} from "../../src/domains/conflux/read";
import { validateConflux } from "../../src/domains/conflux/validate";
import { UNLOCK_KEY, UNLOCK_VALUE } from "../../src/domains/unlock/attributes";
import {
  SAVE_ENTITY,
  USER_RESONANCE_POINTS,
} from "../../src/domains/user/attributes";
import { unitStore } from "../../src/testing";

const node = (taken: boolean): ResonanceNode => ({
  key: "LB",
  cost: 1,
  effects: [],
  taken,
});

const aura = (fields: Partial<Aura>): Aura => ({
  key: "BUFF",
  category: 0,
  obtained: true,
  seen: true,
  ...fields,
});

const conflux = (fields: Partial<Conflux>): Conflux => ({
  resonancePoints: 0,
  resonance: [node(true), node(true), node(false)],
  auras: [aura({})],
  ...fields,
});

describe("readConflux", () => {
  it("reads every node of the tree and every aura of the table", () => {
    // One unit per distinct bonus, every bit set.
    const bonuses = [...new Set(CONFLUX_TREE.map(([hash]) => hash))];
    const units = unitStore({
      [SAVE_ENTITY]: [[USER_RESONANCE_POINTS, 250]],
      ...Object.fromEntries(
        bonuses.map((hash, i) => [
          i + 1,
          [
            [UNLOCK_KEY, hash],
            [UNLOCK_VALUE, -1],
          ],
        ]),
      ),
    });
    const conflux = readConflux(units);

    expect(conflux.resonancePoints).toBe(250);
    // A node per table row, in table order.
    expect(conflux.resonance.map(({ key }) => key)).toEqual(
      CONFLUX_TREE.map(([, key]) => key),
    );
    expect(conflux.resonance.every(({ taken }) => taken)).toBe(true);

    // Every aura of the table, none held.
    expect(conflux.auras.map(({ key }) => key)).toEqual(
      CONFLUX_AURAS.map(([, key]) => key),
    );
    expect(
      conflux.auras.every(({ obtained, seen }) => !obtained && !seen),
    ).toBe(true);
  });

  it("appends an aura the table does not hold", () => {
    const units = unitStore({
      1: [
        [CONFLUX_AURA_KEY, 0x12345678],
        [CONFLUX_AURA_FLAGS, 1 | 2],
      ],
    });
    expect(readConflux(units).auras.at(-1)).toEqual({
      key: "#12345678",
      category: undefined,
      obtained: true,
      seen: true,
    });
  });
});

describe("validateConflux", () => {
  it("passes a tree grown from its root", () => {
    expect(validateConflux(conflux({}))).toEqual([]);
    expect(
      validateConflux(conflux({ resonance: [node(false), node(false)] })),
    ).toEqual([]);
  });

  it("rejects nodes taken without the root, and negative points", () => {
    expect(
      validateConflux(
        conflux({ resonancePoints: -1, resonance: [node(false), node(true)] }),
      ),
    ).toEqual([
      { severity: "reject", code: "negativeResonancePoints", points: -1 },
      { severity: "reject", code: "resonanceRootNotTaken" },
    ]);
  });

  it("warns on an aura seen but not obtained, and one the table lacks", () => {
    expect(
      validateConflux(
        conflux({
          auras: [
            aura({ obtained: false }),
            aura({ key: "#12345678", category: undefined }),
          ],
        }),
      ),
    ).toEqual([
      { severity: "warning", code: "auraSeenNotObtained", key: "BUFF" },
      { severity: "warning", code: "auraNotInTable", key: "#12345678" },
    ]);
  });
});
