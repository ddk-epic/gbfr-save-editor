import type { SaveUnit, ValueOf, ValueType } from "./save-data-binary";
import { SaveFormatError } from "../errors";

/** Units of one SaveDataBinary, looked up by IDType and UnitID. */
export class UnitStore {
  private readonly byIdType = new Map<
    number,
    { valueType: ValueType; units: Map<number, SaveUnit> }
  >();

  constructor(units: readonly SaveUnit[]) {
    for (const unit of units) {
      let group = this.byIdType.get(unit.idType);
      if (!group) {
        group = { valueType: unit.valueType, units: new Map() };
        this.byIdType.set(unit.idType, group);
      }
      if (group.valueType !== unit.valueType) {
        throw new SaveFormatError(
          `IDType ${unit.idType} is stored as both ${group.valueType} and ${unit.valueType}`,
        );
      }
      if (group.units.has(unit.unitId)) {
        throw new SaveFormatError(
          `IDType ${unit.idType} UnitID ${unit.unitId} appears twice`,
        );
      }
      group.units.set(unit.unitId, unit);
    }
  }

  /** IDTypes present, ascending. */
  idTypes(): number[] {
    return [...this.byIdType.keys()].sort((a, b) => a - b);
  }

  valueTypeOf(idType: number): ValueType | undefined {
    return this.byIdType.get(idType)?.valueType;
  }

  get(idType: number, unitId: number): SaveUnit | undefined {
    return this.byIdType.get(idType)?.units.get(unitId);
  }

  /** Units of one IDType, ascending by UnitID. */
  ofIdType(idType: number): SaveUnit[] {
    const units = this.byIdType.get(idType)?.units;
    return units ? [...units.values()].sort((a, b) => a.unitId - b.unitId) : [];
  }

  /** Values of one unit, checked against the expected value type. */
  values<T extends ValueType>(
    idType: number,
    unitId: number,
    valueType: T,
  ): ValueOf[T][] | undefined {
    const unit = this.get(idType, unitId);
    if (!unit) return undefined;
    if (unit.valueType !== valueType) {
      throw new SaveFormatError(
        `IDType ${idType} is ${unit.valueType}, not ${valueType}`,
      );
    }
    return unit.values as ValueOf[T][];
  }
}
