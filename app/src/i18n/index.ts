import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";

export const resources = { en: { translation: en } } as const;

// Keeps <html lang> in step so the browser picks fonts and hyphenation per language.
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React escapes on render.
});

export default i18n;
