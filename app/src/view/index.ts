import { readCharacterData, type Save } from "gbfr-save-editor";
import { buildCharacters } from "./character";
import { buildParty } from "./party";
import { buildShared } from "./shared";
import { isUnresolved } from "./cell";
import type { EquipmentSetView, SaveView, Table } from "./types";

export * from "./types";

const equipmentSetTables = (set: EquipmentSetView): Table[] => [
  set.weapon,
  set.wrightstone,
  set.skills,
  set.sigils,
];

/** Every table of the view: shared, party, then each character's. */
export const allTables = (view: SaveView): Table[] => [
  ...view.shared,
  ...view.party,
  ...view.characters.flatMap((c) => [
    ...c.tables,
    ...c.equipment.flatMap(equipmentSetTables),
  ]),
];

/** Every domain the reader knows, as tables. */
export function buildView(save: Save): SaveView {
  const units = save.slotData.units;
  const data = readCharacterData(units);
  const view: SaveView = {
    shared: buildShared(save, data),
    party: buildParty(data),
    characters: buildCharacters(units, data),
    captain: data.captain,
    slotVersion: save.slotData.version,
    unresolved: 0,
  };
  view.unresolved = allTables(view)
    .flatMap((t) => t.rows)
    .reduce((n, r) => n + r.cells.filter(isUnresolved).length, 0);
  return view;
}
