import { hasUnsetFlag, type Units } from "@gbfr/core";
import {
  INFORMATION_DIALOG_KEY,
  INFORMATION_DIALOG_SHOWN,
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "./attributes";
import { HINT_DIALOGS, HINT_MENUS, HINT_WINDOWS } from "./data";

/** True while `showHints` would change a window, menu or dialog. */
export const hasUnshownHints = (units: Units) =>
  hasUnsetFlag(
    units,
    TUTORIAL_WINDOW_KEY,
    HINT_WINDOWS,
    TUTORIAL_WINDOW_FLAGS,
    "shown",
  ) ||
  hasUnsetFlag(
    units,
    TUTORIAL_MENU_KEY,
    HINT_MENUS,
    TUTORIAL_MENU_FLAGS,
    "shown",
  ) ||
  hasUnsetFlag(
    units,
    INFORMATION_DIALOG_KEY,
    HINT_DIALOGS,
    INFORMATION_DIALOG_SHOWN,
    "shown",
  );
