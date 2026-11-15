import type { Attribute } from "./attribute";
import type { Units } from "./units";

/** True when an entity whose `key` holds one of `hashes` has `flag` clear. */
export const hasUnsetFlag = <K extends string>(
  units: Units,
  key: Attribute<unknown>,
  hashes: readonly number[],
  flags: Attribute<Record<K, boolean>, unknown>,
  flag: K,
) =>
  hashes.some((hash) =>
    units
      .entitiesWhere(key, hash)
      .some((entity) => !units.of(entity).get(flags)[flag]),
  );
