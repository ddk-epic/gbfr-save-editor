import en from "./data/text/en.json";

/** Game text tables, named by gt() table: item, weapon, character... */
export type GameTextTable = keyof typeof en;

/** Game text for one language: table -> archive key -> text. */
export type GameText = Record<GameTextTable, Readonly<Record<string, string>>>;

/** English game text, the fallback for every other language. */
export const EN_TEXT: GameText = en;

/** Languages besides en, each a separate chunk. */
const LOADERS: Record<string, () => Promise<{ default: GameText }>> = {
  ja: () => import("./data/text/ja.json"),
};

/** Game text for a language, undefined when none is generated. */
export async function loadLanguage(
  lang: string,
): Promise<GameText | undefined> {
  if (lang === "en") return EN_TEXT;
  return (await LOADERS[lang]?.())?.default;
}
