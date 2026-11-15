import { describe, expect, it } from "vitest";
import { reuse } from "../../app/src/view/reuse";

const rec = <T>(prev: T, next: T): T => reuse(prev, next);

const clone = <T>(v: T): T => structuredClone(v);

describe("reuse", () => {
  it("returns prev for an identical structure", () => {
    const prev = { a: [1, { b: "x" }], c: undefined };
    expect(rec(prev, clone(prev))).toBe(prev);
  });

  it("renews only the changed path", () => {
    const prev = { a: { x: { n: 1 } }, b: { y: [1, 2] } };
    const next = clone(prev);
    next.a.x.n = 2;
    const out = rec(prev, next);
    expect(out).not.toBe(prev);
    expect(out.a).not.toBe(prev.a);
    expect(out.a.x).not.toBe(prev.a.x);
    expect(out.b).toBe(prev.b);
  });

  it("matches id items after a front insertion", () => {
    const prev = {
      rows: [
        { id: "a", v: 1 },
        { id: "b", v: 2 },
      ],
    };
    const next = {
      rows: [
        { id: "z", v: 0 },
        { id: "a", v: 1 },
        { id: "b", v: 2 },
      ],
    };
    const out = rec(prev, next);
    expect(out.rows).toHaveLength(3);
    expect(out.rows[0]).toBe(next.rows[0]);
    expect(out.rows[1]).toBe(prev.rows[0]);
    expect(out.rows[2]).toBe(prev.rows[1]);
  });

  it("matches items without id by index", () => {
    const prev = { l: [{ n: 1 }, { n: 2 }] };
    const next = { l: [{ n: 1 }, { n: 3 }] };
    const out = rec(prev, next);
    expect(out.l[0]).toBe(prev.l[0]);
    expect(out.l[1]).not.toBe(prev.l[1]);
    expect(out.l[1]).toEqual({ n: 3 });
  });

  it("does not match by key", () => {
    const prev = {
      l: [
        { key: "a", v: 1 },
        { key: "b", v: 2 },
      ],
    };
    const next = {
      l: [
        { key: "b", v: 2 },
        { key: "a", v: 1 },
      ],
    };
    const out = rec(prev, next);
    expect(out.l[0]).not.toBe(prev.l[0]);
    expect(out.l[0]).toEqual({ key: "b", v: 2 });
  });

  it("renews on an added or removed property", () => {
    const prev: { a: number; b?: number } = { a: 1 };
    const added = rec(prev, { a: 1, b: 2 });
    expect(added).toEqual({ a: 1, b: 2 });
    expect(added).not.toBe(prev);
    const wide: { a: number; b?: number } = { a: 1, b: 2 };
    const removed = rec(wide, { a: 1 });
    expect(removed).toEqual({ a: 1 });
    expect(removed).not.toBe(wide);
  });

  it("renews a character differing only in canUnlock, keeping tables", () => {
    const prev = {
      characters: [
        {
          key: "c",
          canUnlock: false,
          tables: [{ id: "t", rows: [{ id: "r", cells: [1] }] }],
          equipment: [],
        },
      ],
    };
    const next = clone(prev);
    next.characters[0]!.canUnlock = true;
    const out = rec(prev, next);
    expect(out.characters).not.toBe(prev.characters);
    expect(out.characters[0]).not.toBe(prev.characters[0]);
    expect(out.characters[0]!.canUnlock).toBe(true);
    expect(out.characters[0]!.tables).toBe(prev.characters[0]!.tables);
  });
});
