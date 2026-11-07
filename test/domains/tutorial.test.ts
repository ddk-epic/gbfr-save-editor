import { describe, expect, it } from "vitest";
import { hashId } from "../../src/core/xxhash32-custom";
import { TIP_FLAGS, TIP_KEY } from "../../src/domains/journal/attributes";
import {
  INFORMATION_DIALOG_KEY,
  INFORMATION_DIALOG_SHOWN,
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "../../src/domains/tutorial/attributes";
import { canDisableHints, disableHints } from "../../src/domains/tutorial/edit";
import { SAVE_HASHSEED } from "../../src/core/save-entity";
import { SaveSession } from "../../src/core/session";
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
      6: [
        [INFORMATION_DIALOG_KEY, 0xa60431d1],
        [INFORMATION_DIALOG_SHOWN, 0],
      ],
      7: [
        [INFORMATION_DIALOG_KEY, 0xf88c0d9a],
        [INFORMATION_DIALOG_SHOWN, 0],
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
    expect(units.values(INFORMATION_DIALOG_SHOWN, 6)).toEqual([1]);
    expect(units.values(INFORMATION_DIALOG_SHOWN, 7)).toEqual([0]);
  });

  it("is offered until every found hint is marked", () => {
    const session = save();
    expect(canDisableHints(session.save)).toBe(true);
    disableHints(session);
    expect(canDisableHints(session.save)).toBe(false);
  });
});
