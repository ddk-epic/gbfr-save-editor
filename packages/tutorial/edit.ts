import type { Draft } from "@gbfr/core/draft";
import {
  INFORMATION_DIALOG_KEY,
  INFORMATION_DIALOG_SHOWN,
  TUTORIAL_MENU_FLAGS,
  TUTORIAL_MENU_KEY,
  TUTORIAL_WINDOW_FLAGS,
  TUTORIAL_WINDOW_KEY,
} from "./attributes";
import { HINT_DIALOGS, HINT_MENUS, HINT_WINDOWS } from "./data";

/** Marks the tutorial windows, menus and dialogs as shown. */
export function showHints(draft: Draft) {
  draft.setWhere(TUTORIAL_WINDOW_KEY, HINT_WINDOWS, TUTORIAL_WINDOW_FLAGS, {
    shown: true,
  });
  draft.setWhere(TUTORIAL_MENU_KEY, HINT_MENUS, TUTORIAL_MENU_FLAGS, {
    shown: true,
  });
  draft.setWhere(
    INFORMATION_DIALOG_KEY,
    HINT_DIALOGS,
    INFORMATION_DIALOG_SHOWN,
    { shown: true },
  );
}
