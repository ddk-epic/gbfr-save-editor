import type { Attribute } from "../core/attribute";
import { checksumIndex, slotChecksum } from "../core/checksum";
import { readContainer } from "../core/container";
import { readSave, type Save } from "../core/read-save";
import { ELEMENTS, type UnitEntity } from "../core/save-data-binary";
import { SAVE_ENTITY, SAVE_HASHSEED } from "../domains/user/attributes";

export interface Patch {
  attribute: Attribute<unknown>;
  entity: UnitEntity;
  values: readonly unknown[];
}

/**
 * A save file open for editing. Edits overwrite unit values in place at the
 * same length, so every other byte stays as the game wrote it, and `save`
 * reads the edited values.
 */
export class SaveSession {
  private constructor(
    private readonly bytes: Uint8Array,
    readonly save: Save,
  ) {}

  /** Reads a copy of the file; `bytes` itself is never written. */
  static open(bytes: Uint8Array): SaveSession {
    const copy = new Uint8Array(bytes);
    return new SaveSession(copy, readSave(copy));
  }

  /** Applies every patch or none: a missing unit or a length change throws first. */
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
