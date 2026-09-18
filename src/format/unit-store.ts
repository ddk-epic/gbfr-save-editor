import type {
  SaveUnit,
  UnitAttribute,
  UnitEntity,
  ValueOf,
  ValueType,
} from "./save-data-binary";
import { SaveFormatError } from "../errors";

/** Units of one SaveDataBinary, looked up by attribute and entity. */
export class UnitStore {
  private readonly byAttribute = new Map<
    UnitAttribute,
    { valueType: ValueType; units: Map<UnitEntity, SaveUnit> }
  >();

  constructor(units: readonly SaveUnit[]) {
    for (const unit of units) {
      let group = this.byAttribute.get(unit.attribute);
      if (!group) {
        group = { valueType: unit.valueType, units: new Map() };
        this.byAttribute.set(unit.attribute, group);
      }
      if (group.valueType !== unit.valueType) {
        throw new SaveFormatError({
          code: "mixedValueType",
          attribute: unit.attribute,
          first: group.valueType,
          second: unit.valueType,
        });
      }
      if (group.units.has(unit.entity)) {
        throw new SaveFormatError({
          code: "duplicateUnit",
          attribute: unit.attribute,
          entity: unit.entity,
        });
      }
      group.units.set(unit.entity, unit);
    }
  }

  /** Attributes present, ascending. */
  attributes(): UnitAttribute[] {
    return [...this.byAttribute.keys()].sort((a, b) => a - b);
  }

  valueTypeOf(attribute: UnitAttribute): ValueType | undefined {
    return this.byAttribute.get(attribute)?.valueType;
  }

  get(attribute: UnitAttribute, entity: UnitEntity): SaveUnit | undefined {
    return this.byAttribute.get(attribute)?.units.get(entity);
  }

  /** Units of one attribute, ascending by entity. */
  withAttribute(attribute: UnitAttribute): SaveUnit[] {
    const units = this.byAttribute.get(attribute)?.units;
    return units ? [...units.values()].sort((a, b) => a.entity - b.entity) : [];
  }

  /** Values of one unit, checked against the expected value type. */
  values<T extends ValueType>(
    attribute: UnitAttribute,
    entity: UnitEntity,
    valueType: T,
  ): ValueOf[T][] | undefined {
    const unit = this.get(attribute, entity);
    if (!unit) return undefined;
    if (unit.valueType !== valueType) {
      throw new SaveFormatError({
        code: "wrongValueType",
        attribute,
        expected: valueType,
        actual: unit.valueType,
      });
    }
    return unit.values as ValueOf[T][];
  }
}
