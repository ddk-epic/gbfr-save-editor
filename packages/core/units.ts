import type { Attribute } from "./attribute";
import type { UnitEntity } from "./save-data-binary";

/** A span of entity numbers, `count` wide, starting at `first`. */
export interface EntityRange {
  first: UnitEntity;
  count: number;
}

/** The values one entity holds, read through typed attributes. */
export interface EntityReader {
  readonly entity: UnitEntity;
  get<T, W>(attribute: Attribute<T, W>): T;
  has(attribute: Attribute<unknown>): boolean;
}

/** Read access to the units of a save. */
export interface Units {
  values(
    attribute: Attribute<unknown>,
    entity: UnitEntity,
  ): readonly unknown[] | undefined;
  of(entity: UnitEntity): EntityReader;
  entitiesWith(
    attribute: Attribute<unknown>,
    range?: EntityRange,
  ): UnitEntity[];
  entitiesWhere(
    attribute: Attribute<unknown>,
    value: number,
    range?: EntityRange,
  ): UnitEntity[];
  onlyEntityWhere(attribute: Attribute<unknown>, value: number): UnitEntity;
}
