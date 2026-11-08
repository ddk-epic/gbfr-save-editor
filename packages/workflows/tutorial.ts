import { type Save, hashId } from "@gbfr/core";
import type { Patch, SaveSession } from "@gbfr/core/session";
import { unlockTips } from "@gbfr/journal/edit";
import { hintPatches } from "@gbfr/tutorial/edit";

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

const disablingPatches = (save: Save): Patch[] => {
  const units = save.slotData.units;
  return [...hintPatches(units), ...unlockTips(units, HINT_TIPS)];
};

/** True on a save with a found hint not marked as shown. */
export const canDisableHints = (save: Save) =>
  disablingPatches(save).length > 0;

/** Marks every found hint as shown, at any point in the story. */
export const disableHints = (session: SaveSession) =>
  session.patch(disablingPatches(session.save));
