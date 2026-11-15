import type { Attribute } from "./attribute";
import type { UnitStore } from "./unit-store";
import type { UnitAttribute, UnitEntity } from "./save-data-binary";
import type { EntityRange, EntityReader, Units } from "./units";

/** One unit's values waiting to be committed. */
export interface PendingWrite {
  attribute: Attribute<unknown>;
  entity: UnitEntity;
  values: readonly unknown[];
}

/** Writes to a save's units held back until a session commits them; reads see them. */
export class Draft implements Units {
  private readonly writes = new Map<
    UnitAttribute,
    Map<UnitEntity, PendingWrite>
  >();

  constructor(readonly units: UnitStore) {}

  /** Keeps `values` for one unit, replacing any earlier write to it. */
  put(
    attribute: Attribute<unknown>,
    entity: UnitEntity,
    values: readonly unknown[],
  ): void {
    let group = this.writes.get(attribute.id);
    if (!group) {
      group = new Map();
      this.writes.set(attribute.id, group);
    }
    group.set(entity, { attribute, entity, values });
  }

  /** Every pending write, one per unit. */
  pending(): PendingWrite[] {
    return [...this.writes.values()].flatMap((group) => [...group.values()]);
  }

  values(
    attribute: Attribute<unknown>,
    entity: UnitEntity,
  ): readonly unknown[] | undefined {
    return (
      this.writes.get(attribute.id)?.get(entity)?.values ??
      this.units.values(attribute, entity)
    );
  }

  of(entity: UnitEntity): DraftEntity {
    return new DraftEntity(this, entity);
  }

  entitiesWith(
    attribute: Attribute<unknown>,
    range?: EntityRange,
  ): UnitEntity[] {
    return this.units.entitiesWith(attribute, range);
  }

  entitiesWhere(
    attribute: Attribute<unknown>,
    value: number,
    range?: EntityRange,
  ): UnitEntity[] {
    return this.units
      .entitiesWith(attribute, range)
      .filter(
        (entity) =>
          (
            this.values(attribute, entity) as (number | boolean)[] | undefined
          )?.[0] === value,
      );
  }

  onlyEntityWhere(attribute: Attribute<unknown>, value: number): UnitEntity {
    const found = this.entitiesWhere(attribute, value);
    if (found.length !== 1)
      throw new Error(`${found.length} units of ${attribute.id} hold ${value}`);
    return found[0]!;
  }

  /** Sets `attribute` on every entity whose `key` holds one of `values`. */
  setWhere<T, W>(
    key: Attribute<unknown>,
    values: readonly number[],
    attribute: Attribute<T, W>,
    value: W,
  ): void {
    for (const held of values)
      for (const entity of this.entitiesWhere(key, held))
        this.of(entity).set(attribute, value);
  }
}

/** The values one entity holds in a draft, with writes into it. */
export class DraftEntity implements EntityReader {
  constructor(
    private readonly draft: Draft,
    readonly entity: UnitEntity,
  ) {}

  get<T, W>(attribute: Attribute<T, W>): T {
    return attribute.read(this.draft.values(attribute, this.entity));
  }

  has(attribute: Attribute<unknown>): boolean {
    return this.draft.units.get(attribute, this.entity) !== undefined;
  }

  /** Sets `value`; flags merge onto the unit's current bits, pending ones included. */
  set<T, W>(attribute: Attribute<T, W>, value: W): void {
    this.draft.put(
      attribute as Attribute<unknown>,
      this.entity,
      attribute.write(value, this.draft.values(attribute, this.entity)),
    );
  }

  /** Sets `value` with no current bits, so flags start from 0. */
  replace<T, W>(attribute: Attribute<T, W>, value: W): void {
    this.draft.units.get(attribute, this.entity);
    this.draft.put(
      attribute as Attribute<unknown>,
      this.entity,
      attribute.write(value, undefined),
    );
  }
}

export const draft = (units: UnitStore): Draft => new Draft(units);
