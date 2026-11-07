import type { Attribute } from "../../core/attribute";
import type { Save } from "../../core/read-save";
import type { UnitStore } from "../../core/unit-store";
import { hashId } from "../../core/xxhash32-custom";
import type { Patch, SaveSession } from "../../core/session";
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
  "TU_ULTIMATE",
  "TU_QUESTSTART",
  "TU_MATCHINGSETTING",
  "TU_RELIC",
  "TUTORIAL_WIN_33",
  "TU_AWEAPON_UPGRADE",
  "TU_AWEAPONLEAD",
  "TU_DAHLIA_TRADE",
  "TU_TRADE_TICKET",
  "TU_GENE_FORGING",
  "TU_EXFORGING",
  "TU_GENECOMB",
  "TU_CHARARELEASE",
  "TU_WP_LIMITBREAK",
  "TUTORIAL_WIN_28",
  "TUTORIAL_WIN_34",
  "TU_BLESSING",
  "TU_WPMIRAGE",
  "TU_SALE",
  "TU_WEAPONBONUS",
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
  "TUTORIAL_ULTIMATE",
  "TUTORIAL_QUESTSTART",
  "TUTORIAL_MATCHINGSETTING",
  "TUTORIAL_REGION_SETTING",
  "TUTORIAL_RELIC",
  "TUTORIAL_NOTE_FATE",
  "TUTORIAL_AWEAPON_UPGRADE",
  "TUTORIAL_AWEAPONLEAD",
  "TUTORIAL_DAHLIA_TRADE",
  "TUTORIAL_TRADE_TICKET",
  "TUTORIAL_GENE_FORGING",
  "TUTORIAL_EXFORGING",
  "TUTORIAL_GENECOMB",
  "TUTORIAL_CHARATICKET",
  "TUTORIAL_CHARARELEASE",
  "TUTORIAL_WP_LIMITBREAK",
  "TUTORIAL_GEEN_STR",
  "TUTORIAL_WEP_CRAFT",
  "TUTORIAL_BLESSING",
  "TUTORIAL_WPMIRAGE",
  "TUTORIAL_SALE",
  "TUTORIAL_WEAPONBONUS",
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
  hashId("NOTE_WINDOW_TIPS_49"),
  hashId("NOTE_WINDOW_TIPS_93"),
  hashId("NOTE_WINDOW_TIPS_98"),
  hashId("NOTE_WINDOW_TIPS_61"),
  0xbc721835,
  0x0a2b64b3,
  0xd880f0b7,
  0xde5da575,
  0xd3d37684,
  0x98471314,
  0x9bff336c,
  0xc6d546d5,
  hashId("NOTE_WINDOW_TIPS_89"),
  hashId("NOTE_WINDOW_TIPS_81"),
  hashId("NOTE_WINDOW_TIPS_75"),
  hashId("NOTE_WINDOW_TIPS_76"),
  hashId("NOTE_WINDOW_TIPS_77"),
  hashId("NOTE_WINDOW_TIPS_78"),
  hashId("NOTE_WINDOW_TIPS_79"),
  hashId("NOTE_WINDOW_TIPS_68"),
  hashId("NOTE_WINDOW_TIPS_72"),
  hashId("NOTE_WINDOW_TIPS_71"),
  hashId("NOTE_WINDOW_TIPS_69"),
  hashId("NOTE_WINDOW_TIPS_70"),
  hashId("NOTE_WINDOW_TIPS_73"),
  hashId("NOTE_WINDOW_TIPS_116"),
  0xf85ca133,
  0x94e09a15,
  0x8675c130,
  0x1400d7a6,
];

/** `infomation_dialog.Key`. */
const HINT_DIALOGS = [
  0xa60431d1, 0x64574a34, 0xb4b28aa5, 0x9818071c, 0x28c2a532, 0x5fb06d4c,
  0x2b1905b3, 0x11453713,
];

function hintPatches(units: UnitStore): Patch[] {
  const patches: Patch[] = [];
  const markShown = (
    key: Attribute<unknown>,
    flags: Attribute<unknown>,
    hashes: readonly number[],
  ) => {
    for (const hash of hashes)
      for (const entity of units.entitiesWhere(key, hash)) {
        const held = Number(units.values(flags, entity)![0]);
        if (held & HINT_SHOWN) continue;
        patches.push({
          attribute: flags,
          entity,
          values: [held | HINT_SHOWN],
        });
      }
  };
  markShown(TUTORIAL_WINDOW_KEY, TUTORIAL_WINDOW_FLAGS, HINT_WINDOWS);
  markShown(TUTORIAL_MENU_KEY, TUTORIAL_MENU_FLAGS, HINT_MENUS);
  markShown(TIP_KEY, TIP_FLAGS, HINT_TIPS);
  markShown(INFORMATION_DIALOG_KEY, INFORMATION_DIALOG_SHOWN, HINT_DIALOGS);
  return patches;
}

/** True on a save with a found hint not marked as shown. */
export const canDisableHints = (save: Save) =>
  hintPatches(save.slotData.units).length > 0;

/** Marks every found hint as shown, at any point in the story. */
export const disableHints = (session: SaveSession) =>
  session.patch(hintPatches(session.save.slotData.units));
