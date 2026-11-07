import { FILE_SIZE } from "./container";
import type { SaveModule } from "./module";
import type { Save } from "./read-save";
import { reject, warning, type Graded } from "./validation";

export type ContainerIssue =
  /** A fixed header field holds another value. */
  | { code: "headerLayout"; field: string; expected: number; actual: number }
  /** SlotData running past the save's fixed file size. */
  | { code: "slotDataPastFileSize"; end: number; fileSize: number }
  /** A version field the reader was not written against. */
  | {
      code: "unexpectedVersion";
      what: string;
      expected: number | undefined;
      actual: number | undefined;
    }
  /** A SlotData checksum of 0. */
  | { code: "zeroChecksum"; index: number };

/** Header fields the format fixes, slotDataSize aside. */
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

export function validateContainer(save: Save): Graded<ContainerIssue>[] {
  const issues: Graded<ContainerIssue>[] = [];
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

export const containerModule: SaveModule<ContainerIssue> = {
  name: "container",
  validate: validateContainer,
};
