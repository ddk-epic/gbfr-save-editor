import type { UnitStore } from "../../core/unit-store";
import { PARTY_CHARACTER, PARTY_FIRST, PARTY_POSITIONS } from "./attributes";

export const readParty = (units: UnitStore): (string | undefined)[] =>
  Array.from({ length: PARTY_POSITIONS }, (_, i) =>
    units.of(PARTY_FIRST + i).get(PARTY_CHARACTER),
  );
