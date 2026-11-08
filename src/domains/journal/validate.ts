import { duplicates, warning, type Graded } from "../../core/validation";
import type { JournalIssue } from "./issues";
import type { SaveModule } from "../../core/module";
import {
  ARCHIVE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "./data.gen";
import {
  readArchives,
  readGlossary,
  readMainStory,
  readMusic,
  readTips,
  type JournalEntry,
} from "./read";

/** One journal list against its key table. The save keeps a row for every table row, unlocked or not. */
export function validateJournalList(
  list: string,
  entries: JournalEntry[],
  keys: Readonly<Record<number, string>>,
): Graded<JournalIssue>[] {
  const issues: Graded<JournalIssue>[] = duplicates(
    entries.map((entry) => entry.key),
  ).map((key) => warning({ code: "duplicateJournalRow", list, key }));
  const expected = Object.keys(keys).length;
  if (entries.length !== expected)
    issues.push(
      warning({
        code: "tableCount",
        table: list,
        held: entries.length,
        expected,
      }),
    );
  return issues;
}

export const journalModule: SaveModule<JournalIssue> = {
  name: "journal",
  validate(save) {
    const units = save.slotData.units;
    return (
      [
        ["story_note_archive", readArchives(units), ARCHIVE_KEYS],
        ["story_note_wordlist", readGlossary(units), GLOSSARY_KEYS],
        ["story_note_tips", readTips(units), TIP_KEYS],
        ["story_note_bgm", readMusic(units), MUSIC_KEYS],
        ["story", readMainStory(units), STORY_KEYS],
      ] as const
    ).flatMap(([list, entries, keys]) =>
      validateJournalList(list, entries, keys),
    );
  },
};
