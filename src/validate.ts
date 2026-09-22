import { FILE_SIZE } from "./core/container";
import { SaveFormatError } from "./core/errors";
import type { Save } from "./core/read-save";
import { reject, warning, type SaveIssue } from "./core/validation";
import {
  ARCHIVE_KEYS,
  GLOSSARY_KEYS,
  MUSIC_KEYS,
  STORY_KEYS,
  TIP_KEYS,
} from "./data/journal";
import { readConflux } from "./domains/conflux/read";
import { validateConflux } from "./domains/conflux/validate";
import {
  readArchives,
  readGlossary,
  readMainStory,
  readMusic,
  readTips,
} from "./domains/journal/read";
import { validateJournalList } from "./domains/journal/validate";
import { readProfile } from "./domains/profile/read";
import { readCounterQuests, readSideQuests } from "./domains/quest/read";
import {
  validateCounterQuests,
  validateSideQuests,
} from "./domains/quest/validate";
import { readTrophies } from "./domains/trophy/read";
import { validateTrophies } from "./domains/trophy/validate";
import { readCharacterData } from "./read/characters";
import { readInventory } from "./read/inventory";
import {
  validateCharacterData,
  validateInventory,
  validateQuestClears,
} from "./read/validate";

/** Header fields the format fixes. Only slotDataSize moves, with what the slot holds. */
const HEADER_LAYOUT = {
  systemDataOffset: 0x34,
  slotDataOffset: 0x1434,
  systemDataSize: 0x410,
} as const;

const VERSIONS = [
  ["mainVersion", (save: Save) => save.header.mainVersion, 2],
  ["subVersion", (save: Save) => save.header.subVersion, 2],
  ["SystemData", (save: Save) => save.systemData.version, undefined],
  ["SlotData", (save: Save) => save.slotData.version, 1],
] as const;

function validateContainer(save: Save): SaveIssue[] {
  const issues: SaveIssue[] = [];
  for (const [field, expected] of Object.entries(HEADER_LAYOUT)) {
    const actual = save.header[field as keyof typeof HEADER_LAYOUT];
    if (actual !== expected)
      issues.push(reject({ code: "headerLayout", field, expected, actual }));
  }
  const end = save.header.slotDataOffset + save.header.slotDataSize;
  if (end > FILE_SIZE)
    issues.push(
      reject({ code: "slotDataPastFileSize", end, fileSize: FILE_SIZE }),
    );
  for (const [what, read, expected] of VERSIONS) {
    const actual = read(save);
    if (actual !== expected)
      issues.push(
        warning({ code: "unexpectedVersion", what, expected, actual }),
      );
  }
  save.checksums.forEach((sum, index) => {
    if (sum === 0n) issues.push(reject({ code: "zeroChecksum", index }));
  });
  return issues;
}

export interface ValidateOptions {
  /** The latest a quest can have been cleared; defaults to the current time. */
  now?: Date;
}

/**
 * Checks claims every save the game writes holds. Save content never makes it
 * throw: a reader throwing SaveFormatError on the way is returned as a reject,
 * and the checks that did not depend on it still run.
 */
export function validateSave(
  save: Save,
  { now = new Date() }: ValidateOptions = {},
): SaveIssue[] {
  const units = save.slotData.units;
  const checks: (() => SaveIssue[])[] = [
    () => validateContainer(save),
    () => validateCharacterData(readCharacterData(units)),
    () => validateInventory(readInventory(units)),
    () => validateConflux(readConflux(units)),
    () => validateTrophies(readTrophies(units)),
    () => validateSideQuests(readSideQuests(units)),
    () => {
      const quests = readCounterQuests(units);
      return [
        ...validateCounterQuests(quests, now),
        ...validateQuestClears(quests, readProfile(units).questsCleared),
      ];
    },
    () =>
      (
        [
          ["story_note_archive", readArchives(units), ARCHIVE_KEYS],
          ["story_note_wordlist", readGlossary(units), GLOSSARY_KEYS],
          ["story_note_tips", readTips(units), TIP_KEYS],
          ["story_note_bgm", readMusic(units), MUSIC_KEYS],
          ["story", readMainStory(units), STORY_KEYS],
        ] as const
      ).flatMap(([list, entries, keys]) =>
        validateJournalList(list, entries, keys),
      ),
  ];
  return checks.flatMap((check) => {
    try {
      return check();
    } catch (error) {
      if (error instanceof SaveFormatError)
        return [{ severity: "reject", ...error.issue }];
      throw error;
    }
  });
}
