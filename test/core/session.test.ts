import { describe, expect, it } from "vitest";
import { Attribute } from "../../packages/core/attribute";
import { checksumIndex, slotChecksum } from "../../packages/core/checksum";
import { readContainer } from "../../packages/core/container";
import { readSave } from "../../packages/core/read-save";
import { SAVE_HASHSEED } from "../../packages/core/save-entity";
import { SaveSession } from "../../packages/core/session";
import { fixtureFile } from "../../packages/gbfr-save-editor/testing";
import { apply } from "../helpers";

const LEVEL = Attribute.int(2704);
const LIST = Attribute.uintList(2818);
const SEED = 23;
/** Encodes after the edited units. */
const TAIL = Attribute.float(9999);

const file = () =>
  fixtureFile({
    0: [[SAVE_HASHSEED, SEED]],
    30000: [
      [LEVEL, 11],
      [LIST, [1, 2, 3]],
    ],
    1: [[TAIL, Array(64).fill(0)]],
  });

/** A save file with room after the slot data. */
const roomyFile = (entities: Parameters<typeof fixtureFile>[0]) => {
  const bytes = fixtureFile(entities);
  const roomy = new Uint8Array(bytes.length + 4096);
  roomy.set(bytes);
  return roomy;
};

const SHORTS = Attribute.ushortList(2819);
const LONGS = Attribute.longList(2820);
const EMPTY = Attribute.intList(2590);

const listFile = () =>
  roomyFile({
    0: [[SAVE_HASHSEED, SEED]],
    30000: [
      [LEVEL, 11],
      [LIST, [1, 2, 3]],
      [SHORTS, [7]],
      [LONGS, [8n]],
    ],
    5: [[EMPTY, []]],
  });

describe("SaveSession.commit lists", () => {
  it("grows a list and keeps every other unit", () => {
    const session = SaveSession.open(listFile());
    apply(session, (draft) => {
      draft.of(30000).set(LIST, [4, 5, 6, 7, 8]);
      draft.of(5).set(EMPTY, [0, 1, 20]);
      draft.of(30000).set(SHORTS, [1, 2, 3]);
      draft.of(30000).set(LONGS, [9n, 10n]);
    });

    expect(session.save.slotData.units.of(30000).get(LIST)).toEqual([
      4, 5, 6, 7, 8,
    ]);
    const units = readSave(session.export()).slotData.units;
    expect(units.of(30000).get(LIST)).toEqual([4, 5, 6, 7, 8]);
    expect(units.of(5).get(EMPTY)).toEqual([0, 1, 20]);
    expect(units.of(30000).get(SHORTS)).toEqual([1, 2, 3]);
    expect(units.of(30000).get(LONGS)).toEqual([9n, 10n]);
    expect(units.of(30000).get(LEVEL)).toBe(11);
  });

  it("moves the checksums past the grown slot data and recomputes them", () => {
    const bytes = listFile();
    const session = SaveSession.open(bytes);
    apply(session, (draft) => draft.of(30000).set(LIST, [4, 5, 6, 7, 8]));
    const exported = session.export();

    const before = readContainer(bytes);
    const after = readContainer(exported);
    const index = checksumIndex(SEED);
    expect(exported.length).toBe(bytes.length);
    expect(after.slotData.length).toBeGreaterThan(before.slotData.length);
    expect(after.header.slotDataSize - before.header.slotDataSize).toBe(
      after.slotData.length - before.slotData.length,
    );
    expect(session.save.header.slotDataSize).toBe(after.header.slotDataSize);
    expect(after.checksums[index]).toBe(slotChecksum(after.slotData, index));
    after.checksums.forEach((sum, i) => {
      if (i !== index) expect(sum).toBe(before.checksums[i]);
    });
  });

  it("writes in place when the list does not grow", () => {
    const session = SaveSession.open(listFile());
    const size = session.save.header.slotDataSize;
    apply(session, (draft) => draft.of(30000).set(LIST, [9, 8]));
    apply(session, (draft) => draft.of(30000).set(LIST, [7, 6]));

    expect(session.save.header.slotDataSize).toBe(size);
    const units = readSave(session.export()).slotData.units;
    expect(units.of(30000).get(LIST)).toEqual([7, 6]);
  });

  it("patches a grown list in its new place", () => {
    const session = SaveSession.open(listFile());
    apply(session, (draft) => draft.of(30000).set(LIST, [4, 5, 6, 7]));
    apply(session, (draft) => draft.of(30000).set(LIST, [1, 1, 1, 1]));

    const units = readSave(session.export()).slotData.units;
    expect(units.of(30000).get(LIST)).toEqual([1, 1, 1, 1]);
  });
});

describe("SaveSession", () => {
  it("reads the edited values and leaves the opened bytes alone", () => {
    const bytes = file();
    const original = bytes.slice();
    const session = SaveSession.open(bytes);
    apply(session, (draft) => draft.of(30000).set(LEVEL, 15));
    expect(session.save.slotData.units.of(30000).get(LEVEL)).toBe(15);
    expect(bytes).toEqual(original);
  });

  it("exports the edits in place with the selected checksum recomputed", () => {
    const bytes = file();
    const session = SaveSession.open(bytes);
    apply(session, (draft) => draft.of(30000).set(LIST, [4, 5, 6]));
    const exported = session.export();

    expect(exported.length).toBe(bytes.length);
    const units = readSave(exported).slotData.units;
    expect(units.of(30000).get(LIST)).toEqual([4, 5, 6]);
    expect(units.of(30000).get(LEVEL)).toBe(11);

    const before = readContainer(bytes);
    const after = readContainer(exported);
    const index = checksumIndex(SEED);
    expect(after.checksums[index]).toBe(slotChecksum(after.slotData, index));
    expect(after.checksums[index]).not.toBe(before.checksums[index]);
    after.checksums.forEach((sum, i) => {
      if (i !== index) expect(sum).toBe(before.checksums[i]);
    });
  });
});
