/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readSave } from "gbfr-save-editor";
import { describe, expect, it, vi } from "vitest";
import { buildView } from "./view";

const SAVE_PATH =
  process.env.GBFR_SAVE ??
  resolve(import.meta.dirname, "../../../tmp/SaveData1.dat");
const hasSave = existsSync(SAVE_PATH);

describe.skipIf(!hasSave)("buildView", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const view = hasSave
    ? buildView(readSave(readFileSync(SAVE_PATH)))
    : (undefined as never);

  it("gives every row one cell per column", () => {
    for (const table of [
      ...view.account,
      ...view.characters.flatMap((c) => c.tables),
    ])
      for (const row of table.rows)
        expect(row.cells, `${table.id} ${row.id}`).toHaveLength(
          table.columns.length,
        );
  });

  it("resolves every key in the save", () => {
    expect(view.unresolved).toBe(0);
  });
});
