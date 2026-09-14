import { readSave } from "gbfr-save-editor";
import { buildView, type SaveView } from "./view";

export interface LoadedSave {
  fileName: string;
  view: SaveView;
}

export type LoadResult = { ok: true; save: LoadedSave } | { ok: false; reason: string };

export async function loadSave(file: File): Promise<LoadResult> {
  try {
    const save = readSave(new Uint8Array(await file.arrayBuffer()));
    return { ok: true, save: { fileName: file.name, view: buildView(save) } };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
