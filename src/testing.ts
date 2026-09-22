// Builds saves in memory for tests, without a SaveData*.dat.

import type { Attribute } from "./core/attribute";
import type { SaveHeader } from "./core/container";
import type { Save } from "./core/read-save";
import type { SaveUnit } from "./core/save-data-binary";
import { UnitStore } from "./core/unit-store";
import { hashId } from "./core/xxhash32-custom";
import {
  CHARACTER_FIRST,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
} from "./domains/character/attributes";
import { ITEM_COUNT, ITEM_KEY } from "./domains/item/attributes";
import { SIGIL_FIRST, SIGIL_ID, SIGIL_KEY } from "./domains/sigil/attributes";

/**
 * The units one entity holds, as attribute and stored values. A value that is
 * not an array stands for a unit holding that one value.
 */
export type EntityUnits = [Attribute<unknown>, unknown][];

export function unitStore(
  entities: Record<number, EntityUnits> = {},
): UnitStore {
  const units: SaveUnit[] = [];
  for (const [entity, pairs] of Object.entries(entities))
    for (const [attribute, values] of pairs)
      units.push({
        attribute: attribute.id,
        entity: Number(entity),
        valueType: attribute.valueType,
        values: Array.isArray(values) ? values : [values],
      } as SaveUnit);
  return new UnitStore(units);
}

/**
 * A save holding one character, one item and one sigil. Enough for anything
 * reading across domains, such as the app's view, to have rows to build.
 */
export const sampleUnits = () =>
  unitStore({
    [CHARACTER_FIRST]: [
      [CHARACTER_KEY, hashId("PL0000")],
      [CHARACTER_LEVEL, 100],
    ],
    1: [
      [ITEM_KEY, hashId("ITEM_10_0000")],
      [ITEM_COUNT, 3],
    ],
    [SIGIL_FIRST]: [
      [SIGIL_ID, 71],
      [SIGIL_KEY, hashId("GEEN_158_13")],
    ],
  });

/** A save with a valid header and checksums around the given SlotData units. */
export function fixtureSave({
  slotData = unitStore(),
  header = {},
  ...rest
}: Partial<Omit<Save, "header" | "slotData">> & {
  slotData?: UnitStore;
  header?: Partial<SaveHeader>;
} = {}): Save {
  return {
    header: {
      mainVersion: 2,
      steamId: 0n,
      subVersion: 2,
      systemDataOffset: 0x34,
      slotDataOffset: 0x1434,
      systemDataSize: 0x410,
      slotDataSize: 0x1000,
      ...header,
    },
    checksums: Array.from({ length: 10 }, () => 1n),
    systemData: { version: undefined, units: unitStore() },
    slotData: { version: 1, units: slotData },
    ...rest,
  };
}
