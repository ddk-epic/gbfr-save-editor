import {
  EN_TEXT,
  loadLanguage,
  type GameText,
  type GameTextTable,
} from "gbfr-save-editor/language";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";

export type { GameTextTable };

const loaded = new Map<string, GameText>([["en", EN_TEXT]]);
const requested = new Set<string>(["en"]);
const listeners = new Set<() => void>();
let version = 0;

const language = () => i18n.language?.split("-")[0] ?? "en";

function load(lng: string) {
  if (requested.has(lng)) return;
  requested.add(lng);
  void loadLanguage(lng).then((text) => {
    if (!text) return;
    loaded.set(lng, text);
    version++;
    listeners.forEach((listener) => listener());
  });
}

load(language());
i18n.on("languageChanged", (lng) => load(lng.split("-")[0]!));

/** Game text for a key in the current language or en, undefined when neither has it. */
export function gt(
  table: GameTextTable,
  key: string | undefined,
): string | undefined {
  if (key === undefined) return undefined;
  return loaded.get(language())?.[table][key] ?? EN_TEXT[table][key];
}

/** gt, re-rendering when the language or its loaded text changes. */
export function useGameText() {
  useTranslation();
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
  );
  return gt;
}
