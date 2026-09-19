import type {
  SaveUnit,
  UnitAttribute,
  UnitEntity,
  ValueOf,
  ValueType,
} from "./save-data-binary";
import type { Attribute } from "./attribute";
import { SaveFormatError } from "./errors";

/** A span of entity numbers, `count` wide, starting at `first`. */
export interface EntityRange {
  first: UnitEntity;
  count: number;
}

const within = (range: EntityRange, entity: UnitEntity) =>
  entity >= range.first && entity < range.first + range.count;

/** The standard lower bound binary search. */
function firstIndexAtOrAbove(
  entities: readonly UnitEntity[],
  entity: UnitEntity,
) {
  let low = 0;
  let high = entities.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (entities[mid]! < entity) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** Units of one SaveDataBinary, looked up by attribute and entity. */
export class UnitStore {
  private readonly byAttribute = new Map<
    UnitAttribute,
    { valueType: ValueType; units: Map<UnitEntity, SaveUnit> }
  >();
  /** Entities per attribute, ascending, built on first query. */
  private readonly sorted = new Map<UnitAttribute, UnitEntity[]>();

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

  private sortedEntities(attribute: UnitAttribute): readonly UnitEntity[] {
    let entities = this.sorted.get(attribute);
    if (!entities) {
      const units = this.byAttribute.get(attribute)?.units;
      entities = units ? [...units.keys()].sort((a, b) => a - b) : [];
      this.sorted.set(attribute, entities);
    }
    return entities;
  }

  of(entity: UnitEntity): EntityValues {
    return new EntityValues(this, entity);
  }

  /**
   * Entities holding one attribute, ascending. Entities the save does not
   * hold are left out, `range` included.
   */
  entitiesWith(
    attribute: Attribute<unknown>,
    range?: EntityRange,
  ): UnitEntity[] {
    const entities = this.sortedEntities(attribute.id);
    if (!range) return entities.slice();
    return entities.slice(
      firstIndexAtOrAbove(entities, range.first),
      firstIndexAtOrAbove(entities, range.first + range.count),
    );
  }

  /**
   * Entities whose unit for one attribute holds `value` as its first value,
   * ascending. The search is over the attribute's units alone, so a `range`
   * only narrows what is returned.
   */
  entitiesWhere(
    attribute: UnitAttribute,
    value: number,
    range?: EntityRange,
  ): UnitEntity[] {
    const units = this.byAttribute.get(attribute)?.units;
    if (!units) return [];
    const found: UnitEntity[] = [];
    for (const [entity, unit] of units)
      if (
        (unit.values as (number | boolean)[])[0] === value &&
        (!range || within(range, entity))
      )
        found.push(entity);
    return found.sort((a, b) => a - b);
  }

  /** Units of one attribute, ascending by entity. */
  withAttribute(attribute: UnitAttribute): SaveUnit[] {
    const units = this.byAttribute.get(attribute)?.units;
    if (!units) return [];
    return this.sortedEntities(attribute).map((entity) => units.get(entity)!);
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

/** The values one entity holds, read through typed attributes. */
export class EntityValues {
  constructor(
    private readonly store: UnitStore,
    readonly entity: UnitEntity,
  ) {}

  /** The attribute's value, or its fallback when the save holds no unit. */
  get<T>(attribute: Attribute<T>): T {
    return attribute.read(
      this.store.values(attribute.id, this.entity, attribute.valueType),
    );
  }

  has(attribute: Attribute<unknown>): boolean {
    return this.store.get(attribute.id, this.entity) !== undefined;
  }
}
