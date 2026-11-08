import type { Attribute } from "./attribute";
import { checksumIndex, slotChecksum } from "./checksum";
import {
  CHECKSUM_COUNT,
  FOOTER_SIZE,
  readContainer,
  SLOT_DATA_SIZE_AT,
} from "./container";
import { readSave, type Save } from "./read-save";
import type { Patch } from "./unit-store";
import { ELEMENTS, type SaveUnit, type UnitEntity } from "./save-data-binary";
import { SAVE_ENTITY, SAVE_HASHSEED } from "./save-entity";

const VTABLE_SIZE = 12;
const UNIT_VALUES_FIELD = 12;

export type { Patch };

/** A save file open for editing, values overwritten in place. */
export class SaveSession {
  private constructor(
    private readonly bytes: Uint8Array,
    readonly save: Save,
  ) {}

  /** Opens a copy of `bytes`. */
  static open(bytes: Uint8Array): SaveSession {
    const copy = new Uint8Array(bytes);
    return new SaveSession(copy, readSave(copy));
  }

  /** Applies every patch, or none on a missing unit or length change. */
  patch(patches: readonly Patch[]): void {
    const units = this.save.slotData.units;
    const targets = patches.map(({ attribute, entity, values }) => {
      const unit = units.get(attribute, entity);
      if (unit?.valuesAt === undefined)
        throw new Error(`no unit ${attribute.id} at ${entity} to patch`);
      if (unit.values.length !== values.length)
        throw new Error(
          `unit ${attribute.id} at ${entity} holds ${unit.values.length} values, not ${values.length}`,
        );
      return { unit, values };
    });

    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset);
    const base = this.save.header.slotDataOffset;
    for (const { unit, values } of targets) {
      const element = ELEMENTS[unit.valueType] as {
        size: number;
        write: (view: DataView, at: number, value: unknown) => void;
      };
      values.forEach((value, i) => {
        element.write(view, base + unit.valuesAt! + i * element.size, value);
        (unit.values as unknown[])[i] = value;
      });
    }
  }

  /** Replaces a list's values, moving a longer list past the end of the slot data. */
  setList(
    attribute: Attribute<unknown>,
    entity: UnitEntity,
    values: readonly unknown[],
  ): void {
    const unit = this.save.slotData.units.get(attribute, entity);
    if (unit?.tableEntryAt === undefined)
      throw new Error(`no unit ${attribute.id} at ${entity} to set`);
    const element = ELEMENTS[unit.valueType] as {
      size: number;
      write: (view: DataView, at: number, value: unknown) => void;
    };
    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset);
    const base = this.save.header.slotDataOffset;

    let valuesAt = unit.valuesAt;
    if (valuesAt === undefined || values.length > unit.values.length) {
      valuesAt = this.appendUnit(unit, values.length, element.size);
    } else {
      view.setUint32(base + valuesAt - 4, values.length, true);
    }

    values.forEach((value, i) =>
      element.write(view, base + valuesAt + i * element.size, value),
    );
    unit.valuesAt = valuesAt;
    (unit.values as unknown[]).splice(0, unit.values.length, ...values);
  }

  /** Writes a new unit table after the slot data and returns its values position. */
  private appendUnit(
    unit: SaveUnit,
    length: number,
    elementSize: number,
  ): number {
    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset);
    const base = this.save.header.slotDataOffset;
    const end = readContainer(this.bytes).slotData.length;

    const vtable = end + (-end & 3);
    const table = vtable + VTABLE_SIZE;
    const valuesField = table + UNIT_VALUES_FIELD;
    const firstVector = valuesField + 4;
    const padding = elementSize === 8 ? -(firstVector + 4) & 7 : 0;
    const vector = firstVector + padding;
    const valuesAt = vector + 4;
    const valuesEnd = valuesAt + length * elementSize;
    const newEnd = valuesEnd + (-valuesEnd & 3);

    const tailSize = CHECKSUM_COUNT * 8 + FOOTER_SIZE;
    if (base + newEnd + tailSize > this.bytes.length)
      throw new Error(`unit ${unit.attribute} does not fit the file`);

    const tail = this.bytes.slice(base + end, base + end + tailSize);
    this.bytes.fill(0, base + end, base + newEnd);
    this.bytes.set(tail, base + newEnd);
    view.setBigUint64(base + newEnd + CHECKSUM_COUNT * 8, BigInt(newEnd), true);
    this.save.header.slotDataSize = newEnd + tailSize;
    view.setBigUint64(SLOT_DATA_SIZE_AT, BigInt(newEnd + tailSize), true);

    view.setUint16(base + vtable, VTABLE_SIZE - 2, true);
    view.setUint16(base + vtable + 2, UNIT_VALUES_FIELD + 4, true);
    view.setUint16(base + vtable + 4, 4, true);
    view.setUint16(base + vtable + 6, 8, true);
    view.setUint16(base + vtable + 8, UNIT_VALUES_FIELD, true);
    view.setInt32(base + table, table - vtable, true);
    view.setUint32(base + table + 4, unit.attribute, true);
    view.setUint32(base + table + 8, unit.entity, true);
    view.setUint32(base + valuesField, vector - valuesField, true);
    view.setUint32(base + vector, length, true);

    const entry = unit.tableEntryAt!;
    view.setUint32(base + entry, table - entry, true);
    return valuesAt;
  }

  /** The edited file, with the checksum the game checks recomputed. */
  export(): Uint8Array<ArrayBuffer> {
    const { slotData } = readContainer(this.bytes);
    const index = checksumIndex(
      this.save.slotData.units.of(SAVE_ENTITY).get(SAVE_HASHSEED),
    );
    const checksum = slotChecksum(slotData, index);
    new DataView(this.bytes.buffer, this.bytes.byteOffset).setBigUint64(
      this.save.header.slotDataOffset + slotData.length + index * 8,
      checksum,
      true,
    );
    this.save.checksums[index] = checksum;
    return new Uint8Array(this.bytes);
  }
}
