import {
  SaveFormatError,
  validateSave,
  type SaveFormatIssue,
  type SaveIssue,
} from "gbfr-save-editor";
import { SaveSession } from "gbfr-save-editor/edit";
import { buildView, type SaveView } from "../view";
import { useWatched, Watched } from "./watched";

export interface LoadedSave {
  fileName: string;
  session: SaveSession;
  view: SaveView;
  /** What validation found in the save, rejects first. */
  issues: SaveIssue[];
  edited: boolean;
}

/** A rejected save's issue, or `unexpected` for anything other than a format error. */
export type LoadError = SaveFormatIssue | { code: "unexpected" };

export type LoadResult =
  { ok: true; save: LoadedSave } | { ok: false; error: LoadError };

/** The open save, undefined before one loads. */
export const loaded = new Watched<LoadedSave | undefined>(undefined);
/** Why the last file failed to load. */
export const loadError = new Watched<LoadError | undefined>(undefined);

export const useSave = <S>(select: (save: LoadedSave | undefined) => S) =>
  useWatched(loaded, select);
export const useView = () => useWatched(loaded, (save) => save?.view);
export const useLoadError = () => useWatched(loadError);

const validate = (session: SaveSession) =>
  validateSave(session.save).sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "reject" ? -1 : 1,
  );

export async function loadSave(file: File): Promise<LoadResult> {
  try {
    const session = SaveSession.open(new Uint8Array(await file.arrayBuffer()));
    return {
      ok: true,
      save: {
        fileName: file.name,
        session,
        view: buildView(session.save),
        issues: validate(session),
        edited: false,
      },
    };
  } catch (error) {
    if (error instanceof SaveFormatError)
      return { ok: false, error: error.issue };
    console.error(error);
    return { ok: false, error: { code: "unexpected" } };
  }
}

/** Runs `edit` on the session and rebuilds the view. */
export function applyEdit(
  save: LoadedSave,
  edit: (session: SaveSession) => void,
): LoadedSave {
  edit(save.session);
  return {
    ...save,
    view: buildView(save.session.save),
    issues: validate(save.session),
    edited: true,
  };
}

export function downloadSave(save: LoadedSave) {
  const url = URL.createObjectURL(new Blob([save.session.export()]));
  const link = document.createElement("a");
  link.href = url;
  link.download = save.fileName;
  link.click();
  URL.revokeObjectURL(url);
}
