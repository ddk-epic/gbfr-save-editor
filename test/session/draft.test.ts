import { describe, expect, it } from "vitest";
import { Attribute } from "../../packages/core/attribute";
import { draft } from "../../packages/core/draft";
import { SAVE_HASHSEED } from "../../packages/core/save-entity";
import { SaveSession } from "../../packages/core/session";
import {
  fixtureFile,
  unitStore,
} from "../../packages/gbfr-save-editor/testing";

const LEVEL = Attribute.int(2704);
const KIND = Attribute.int(2705);
const LIST = Attribute.uintList(2818);
const EMPTY = Attribute.intList(2590);
const FLAGS = Attribute.flags(2900, { A: 1, B: 2, C: 4 });
const NAME = Attribute.text(2901, "byte");
const SEED = 23;

/** A save file with room after the slot data. */
const roomyFile = () => {
  const bytes = fixtureFile({
    0: [[SAVE_HASHSEED, SEED]],
    30000: [
      [LEVEL, 11],
      [KIND, 1],
      [LIST, [1, 2, 3]],
      [FLAGS, 1],
    ],
    30001: [
      [LEVEL, 12],
      [KIND, 1],
    ],
    30002: [
      [LEVEL, 13],
      [KIND, 2],
    ],
    5: [[EMPTY, []]],
  });
  const roomy = new Uint8Array(bytes.length + 4096);
  roomy.set(bytes);
  return roomy;
};

const open = () => SaveSession.open(roomyFile());
const unitsOf = (session: SaveSession) => session.save.slotData.units;

describe("Draft reads", () => {
  it("serves pending values before the store", () => {
    const session = open();
    const d = draft(unitsOf(session));
    d.of(30000).set(LEVEL, 50);
    d.of(30000).set(LIST, [9]);

    expect(d.of(30000).get(LEVEL)).toBe(50);
    expect(d.values(LEVEL, 30000)).toEqual([50]);
    expect(d.of(30000).get(LIST)).toEqual([9]);
    expect(d.of(30001).get(LEVEL)).toBe(12);
    expect(d.of(30000).has(LEVEL)).toBe(true);
    expect(d.of(30099).has(LEVEL)).toBe(false);
  });

  it("matches pending values in entitiesWhere and onlyEntityWhere", () => {
    const session = open();
    const d = draft(unitsOf(session));
    d.of(30002).set(KIND, 1);
    d.of(30000).set(KIND, 7);

    expect(d.entitiesWhere(KIND, 1)).toEqual([30001, 30002]);
    expect(d.entitiesWhere(KIND, 1, { first: 30002, count: 1 })).toEqual([
      30002,
    ]);
    expect(d.onlyEntityWhere(KIND, 7)).toBe(30000);
    expect(() => d.onlyEntityWhere(KIND, 1)).toThrow();
    expect(unitsOf(session).entitiesWhere(KIND, 1)).toEqual([30000, 30001]);
  });

  it("leaves entitiesWith unchanged", () => {
    const session = open();
    const d = draft(unitsOf(session));
    d.of(30000).set(LEVEL, 50);
    expect(d.entitiesWith(LEVEL)).toEqual(unitsOf(session).entitiesWith(LEVEL));
  });
});

describe("Draft writes", () => {
  it("merges flags onto pending values with set", () => {
    const d = draft(unitsOf(open()));
    d.of(30000).set(FLAGS, { B: true });
    d.of(30000).set(FLAGS, { C: true });
    expect(d.values(FLAGS, 30000)).toEqual([7]);
  });

  it("starts flags from 0 with replace", () => {
    const d = draft(unitsOf(open()));
    d.of(30000).replace(FLAGS, { B: true });
    expect(d.values(FLAGS, 30000)).toEqual([2]);
  });

  it("sizes text from the unit", () => {
    const d = draft(unitStore({ 1: [[NAME, [1, 2, 3]]] }));
    d.of(1).set(NAME, "A");
    expect(d.values(NAME, 1)).toEqual([65, 0, 0]);
  });

  it("keeps the last write per attribute and entity", () => {
    const d = draft(unitsOf(open()));
    d.of(30000).set(LEVEL, 1);
    d.of(30000).set(LEVEL, 2);
    expect(d.pending()).toHaveLength(1);
    expect(d.of(30000).get(LEVEL)).toBe(2);
  });

  it("sets every entity whose key matches", () => {
    const d = draft(unitsOf(open()));
    d.setWhere(KIND, [1], LEVEL, 99);
    expect(d.entitiesWhere(LEVEL, 99)).toEqual([30000, 30001]);
  });

  it("does not change the session until commit", () => {
    const session = open();
    const before = session.export();
    const d = draft(unitsOf(session));
    d.of(30000).set(LEVEL, 50);
    d.of(30000).set(LIST, [1, 2, 3, 4]);

    expect(unitsOf(session).of(30000).get(LEVEL)).toBe(11);
    expect(session.export()).toEqual(before);
  });
});

describe("SaveSession.commit", () => {
  it("writes same-length values in place", () => {
    const session = open();
    const sizeBefore = session.save.header.slotDataSize;
    const d = draft(unitsOf(session));
    d.of(30000).set(LEVEL, 50);
    d.of(30000).set(LIST, [7, 8, 9]);

    expect(session.commit(d)).toBe(true);
    expect(session.save.header.slotDataSize).toBe(sizeBefore);
    const read = SaveSession.open(session.export()).save.slotData.units;
    expect(read.of(30000).get(LEVEL)).toBe(50);
    expect(read.of(30000).get(LIST)).toEqual([7, 8, 9]);
  });

  it("routes longer, shorter and valueless units to the list write", () => {
    const session = open();
    const d = draft(unitsOf(session));
    d.of(30000).set(LIST, [1, 2, 3, 4, 5]);
    d.of(5).set(EMPTY, [4, 5]);
    expect(session.commit(d)).toBe(true);

    const shorter = draft(unitsOf(session));
    shorter.of(30000).set(LIST, [6]);
    expect(session.commit(shorter)).toBe(true);

    const read = SaveSession.open(session.export()).save.slotData.units;
    expect(read.of(30000).get(LIST)).toEqual([6]);
    expect(read.of(5).get(EMPTY)).toEqual([4, 5]);
    expect(read.of(30000).get(LEVEL)).toBe(11);
  });

  it("skips no-ops and reports whether anything changed", () => {
    const session = open();
    const before = session.export();
    const d = draft(unitsOf(session));
    d.of(30000).set(LEVEL, 11);
    d.of(30000).set(LIST, [1, 2, 3]);
    d.of(5).set(EMPTY, []);

    expect(session.commit(d)).toBe(false);
    expect(session.export()).toEqual(before);
    expect(session.commit(draft(unitsOf(session)))).toBe(false);
  });

  it("restores the bytes and the save after a failed commit", () => {
    const session = open();
    const before = session.export();
    const d = draft(unitsOf(session));
    d.of(30000).set(LIST, [1, 2, 3, 4]);
    d.of(30000).set(LEVEL, 50);
    d.of(5).set(EMPTY, Array(10000).fill(1));

    expect(() => session.commit(d)).toThrow(/does not fit/);
    expect(session.export()).toEqual(before);
    const units = unitsOf(session);
    expect(units.of(30000).get(LIST)).toEqual([1, 2, 3]);
    expect(units.of(30000).get(LEVEL)).toBe(11);
    expect(units.of(5).get(EMPTY)).toEqual([]);
  });

  it("throws on a unit the save does not hold, leaving the save as it was", () => {
    const session = open();
    const before = session.export();
    const d = draft(unitsOf(session));
    d.of(30000).set(LIST, [1, 2, 3, 4]);
    d.of(30099).replace(LEVEL, 1);

    expect(() => session.commit(d)).toThrow(/no unit/);
    expect(session.export()).toEqual(before);
    expect(unitsOf(session).of(30000).get(LIST)).toEqual([1, 2, 3]);
  });

  it("rejects a draft made over another session's units", () => {
    const d = draft(unitsOf(open()));
    d.of(30000).set(LEVEL, 50);
    expect(() => open().commit(d)).toThrow(/other units/);
  });
});
