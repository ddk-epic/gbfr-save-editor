import type { SaveSession } from "gbfr-save-editor/edit";
import type { SaveView } from "../view";
import { startAt } from "./navigation";
import { applyEdit, downloadSave, loaded, loadError, loadSave } from "./save";
import { resetSections } from "./sections";
import { clearSelection, select, type RowRef } from "./selection";

export async function openFile(file: File) {
  const result = await loadSave(file);
  if (!result.ok) {
    loadError.set(result.error);
    return;
  }
  resetSections();
  clearSelection();
  loaded.set(result.save);
  loadError.set(undefined);
  startAt("save");
}

/** Opens the file picker for a .dat save. */
export function pickFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".dat";
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void openFile(file);
  };
  input.click();
}

/** Runs an edit, then selects the row `selectAfter` picks in the new view, or none. */
export function edit(
  run: (session: SaveSession) => void,
  selectAfter?: (view: SaveView) => RowRef | undefined,
) {
  const save = loaded.get();
  if (!save) return;
  const next = applyEdit(save, run);
  loaded.set(next);
  select(selectAfter?.(next.view));
}

export function download() {
  const save = loaded.get();
  if (save) downloadSave(save);
}
