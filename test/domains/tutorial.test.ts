import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import { TIP_FLAGS, TIP_KEY } from "../../src/domains/journal/attributes";
import {
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "../../src/domains/tutorial/attributes";
import { disableHints } from "../../src/domains/tutorial/edit";
import { SAVE_HASHSEED } from "../../src/domains/user/attributes";
import { SaveSession } from "../../src/save/session";
import { fixtureFile } from "../../src/testing";

const save = () =>
  SaveSession.open(
    fixtureFile({
      0: [[SAVE_HASHSEED, 23]],
      1: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_SETTING")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      2: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_MAP")],
        [TUTORIAL_WINDOW_FLAGS, 3],
      ],
      3: [
        [TUTORIAL_WINDOW_KEY, hashId("TU_NOT_FOUND")],
        [TUTORIAL_WINDOW_FLAGS, 0],
      ],
      4: [
        [TUTORIAL_MENU_KEY, hashId("TUTORIAL_SETTING")],
        [TUTORIAL_MENU_FLAGS, 0],
      ],
      5: [
        [TIP_KEY, hashId("NOTE_WINDOW_TIPS_127")],
        [TIP_FLAGS, 2],
      ],
    }),
  );

describe("disableHints", () => {
  it("marks found hints as shown and leaves other rows and bits alone", () => {
    const session = save();
    disableHints(session);
    const units = session.save.slotData.units;

    expect(units.values(TUTORIAL_WINDOW_FLAGS, 1)).toEqual([1]);
    expect(units.values(TUTORIAL_WINDOW_FLAGS, 2)).toEqual([3]);
    expect(units.values(TUTORIAL_WINDOW_FLAGS, 3)).toEqual([0]);
    expect(units.values(TUTORIAL_MENU_FLAGS, 4)).toEqual([1]);
    expect(units.values(TIP_FLAGS, 5)).toEqual([3]);
  });
});
