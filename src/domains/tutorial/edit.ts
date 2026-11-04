import type { Attribute } from "../../core/attribute";
import { hashId } from "../../core/xxhash32-custom";
import type { Patch, SaveSession } from "../../save/session";
import { TIP_FLAGS, TIP_KEY } from "../journal/attributes";
import {
  INFORMATION_DIALOG_KEY,
  INFORMATION_DIALOG_SHOWN,
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "./attributes";

const HINT_SHOWN = 1;

const HINT_WINDOWS = [
  "TU_MAP",
  "TU_SETTING",
  "TUTORIAL_WIN_07",
  "TUTORIAL_WIN_32",
  "TU_ACT_PL0000",
  "TU_ACT_PL0100",
  "TU_GN",
  "TU_BOSSARTSAURA",
  "TU_SHOPFUNC",
  "TU_CHARATICKET",
  "TU_QUESTGUIDE",
  "TU_LIMITBREAK",
  "TU_PHOTO",
  "TUTORIAL_WIN_31",
  "TU_MOVETOWN",
].map(hashId);

const HINT_MENUS = [
  "TUTORIAL_MAP",
  "TUTORIAL_PAD_ASSSGN",
  "TUTORIAL_SETTING",
  "TUTORIAL_BOSSARTSAURA",
  "TUTORIAL_GN",
  "TUTORIAL_LIMITBREAK",
  "TUTORIAL_PHOTO",
  "TUTORIAL_EQUIP",
].map(hashId);

const HINT_TIPS = [
  594130054,
  2065024838,
  0x06d4f9a2,
  0x98ddc36e,
  0xcb7db2d1,
  hashId("NOTE_WINDOW_TIPS_127"),
  0xbfe7448e,
  hashId("NOTE_WINDOW_TIPS_48"),
  hashId("NOTE_WINDOW_TIPS_55"),
  0x1c841dc4,
  hashId("NOTE_WINDOW_TIPS_43"),
  0x6f1a2d86,
  hashId("NOTE_WINDOW_TIPS_65"),
  hashId("NOTE_WINDOW_TIPS_80"),
  hashId("NOTE_WINDOW_TIPS_110"),
  3720559472,
];

/** `infomation_dialog.Key`. */
const HINT_DIALOGS = [0xa60431d1, 0x64574a34];

/** Marks every found hint as shown, at any point in the story. */
export function disableHints(session: SaveSession) {
  const units = session.save.slotData.units;
  const patches: Patch[] = [];
  const markShown = (
    key: Attribute<unknown>,
    flags: Attribute<unknown>,
    hashes: readonly number[],
  ) => {
    for (const hash of hashes)
      for (const entity of units.entitiesWhere(key, hash))
        patches.push({
          attribute: flags,
          entity,
          values: [Number(units.values(flags, entity)![0]) | HINT_SHOWN],
        });
  };
  markShown(TUTORIAL_WINDOW_KEY, TUTORIAL_WINDOW_FLAGS, HINT_WINDOWS);
  markShown(TUTORIAL_MENU_KEY, TUTORIAL_MENU_FLAGS, HINT_MENUS);
  markShown(TIP_KEY, TIP_FLAGS, HINT_TIPS);
  markShown(INFORMATION_DIALOG_KEY, INFORMATION_DIALOG_SHOWN, HINT_DIALOGS);
  session.patch(patches);
}
