import {
  readSave,
  SaveFormatError,
  validateSave,
  type SaveFormatIssue,
  type SaveIssue,
} from "gbfr-save-editor";
import { buildView, type SaveView } from "./view";

export interface LoadedSave {
  fileName: string;
  view: SaveView;
  /** What validation found in the save, rejects first. */
  issues: SaveIssue[];
}

/** A rejected save's issue, or `unexpected` for anything other than a format error. */
export type LoadError = SaveFormatIssue | { code: "unexpected" };

export type LoadResult =
  { ok: true; save: LoadedSave } | { ok: false; error: LoadError };

export async function loadSave(file: File): Promise<LoadResult> {
  try {
    const save = readSave(new Uint8Array(await file.arrayBuffer()));
    const issues = validateSave(save);
    return {
      ok: true,
      save: {
        fileName: file.name,
        view: buildView(save),
        issues: issues.sort((a, b) =>
          a.severity === b.severity ? 0 : a.severity === "reject" ? -1 : 1,
        ),
      },
    };
  } catch (error) {
    if (error instanceof SaveFormatError)
      return { ok: false, error: error.issue };
    console.error(error);
    return { ok: false, error: { code: "unexpected" } };
  }
}
