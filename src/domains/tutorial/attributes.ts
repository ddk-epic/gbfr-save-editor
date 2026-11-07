import { Attribute } from "../../core/attribute";

export const TUTORIAL_WINDOW_KEY = Attribute.uint(5901);
export const TUTORIAL_WINDOW_FLAGS = Attribute.flags(5902, { shown: 1 });
export const TUTORIAL_MENU_KEY = Attribute.uint(6001);
export const TUTORIAL_MENU_FLAGS = Attribute.flags(6002, { shown: 1 });
export const INFORMATION_DIALOG_KEY = Attribute.uint(7301);
export const INFORMATION_DIALOG_SHOWN = Attribute.flags(7302, { shown: 1 });
