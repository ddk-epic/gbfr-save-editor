import { describe, expect, it } from "vitest";
import { Attribute } from "../../src/core/attribute";
import { checksumIndex, slotChecksum } from "../../src/core/checksum";
import { readContainer } from "../../src/core/container";
import { readSave } from "../../src/core/read-save";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/session/save-session";
import { fixtureFile } from "../../src/testing";

const LEVEL = Attribute.int(2704);
const LIST = Attribute.uintList(2818);
const SEED = 23;
/** Floats encode last, keeping the edited units clear of the trimmed tail no checksum covers. */
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

describe("SaveSession", () => {
  it("reads the edited values and leaves the opened bytes alone", () => {
    const bytes = file();
    const original = bytes.slice();
    const session = SaveSession.open(bytes);
    session.patch([{ attribute: LEVEL, entity: 30000, values: [15] }]);
    expect(session.save.slotData.units.of(30000).get(LEVEL)).toBe(15);
    expect(bytes).toEqual(original);
  });

  it("exports the edits in place with the selected checksum recomputed", () => {
    const bytes = file();
    const session = SaveSession.open(bytes);
    session.patch([{ attribute: LIST, entity: 30000, values: [4, 5, 6] }]);
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

  it("applies none of a batch when one patch cannot be applied", () => {
    const session = SaveSession.open(file());
    const at = session.save.slotData.units.of(30000);
    expect(() =>
      session.patch([
        { attribute: LEVEL, entity: 30000, values: [15] },
        { attribute: LIST, entity: 30000, values: [4] },
      ]),
    ).toThrow("holds 3 values, not 1");
    expect(() =>
      session.patch([{ attribute: LEVEL, entity: 30001, values: [15] }]),
    ).toThrow("no unit 2704 at 30001");
    expect(at.get(LEVEL)).toBe(11);
  });
});
