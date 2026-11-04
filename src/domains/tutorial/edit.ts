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
  "TUTORIAL_WIN_29",
  "TU_ITEM",
  "TU_NOTE",
  "TUTORIAL_WIN_21",
  "TU_QUESTRANK",
  "TU_SHUFFLEQUEST",
  "TU_CHAPTERSELECT",
  "TU_GHOST_AI_DISPATCH",
  "TU_MENU_QUESTSELECT",
  "TU_FAST_TRAVEL",
  "TU_STATION",
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
  "TUTORIAL_ABILITYEQ",
  "TUTORIAL_ITEM",
  "TUTORIAL_NOTE",
  "TUTORIAL_QUEST_COUNTER",
  "TUTORIAL_QUESTRANK",
  "TUTORIAL_SHUFFLEQUEST",
  "TUTORIAL_CHAPTERSELECT",
  "TUTORIAL_GHOST_AI_DISPATCH",
  "TUTORIAL_MENU_QUESTSELECT",
  "TUTORIAL_FAST_TRAVEL",
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
  hashId("NOTE_WINDOW_TIPS_117"),
  hashId("NOTE_WINDOW_TIPS_118"),
  hashId("NOTE_WINDOW_TIPS_119"),
  hashId("NOTE_WINDOW_TIPS_121"),
  hashId("NOTE_WINDOW_TIPS_131"),
  2043388923,
  951310505,
  4077825340,
  hashId("NOTE_WINDOW_TIPS_82"),
  hashId("NOTE_WINDOW_TIPS_83"),
  hashId("NOTE_WINDOW_TIPS_86"),
  hashId("NOTE_WINDOW_TIPS_87"),
  hashId("NOTE_WINDOW_TIPS_99"),
  hashId("NOTE_WINDOW_TIPS_100"),
  hashId("NOTE_WINDOW_TIPS_101"),
  1762558635,
  3309052015,
  2615852220,
  3949543317,
  2588951308,
  hashId("NOTE_WINDOW_TIPS_96"),
  hashId("NOTE_WINDOW_TIPS_47"),
];

/** `infomation_dialog.Key`. */
const HINT_DIALOGS = [
  0xa60431d1, 0x64574a34, 0xb4b28aa5, 0x9818071c, 0x28c2a532,
];

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
