import type {
  Cell,
  CharacterView,
  EquipmentSetView,
  KeyCell,
  SaveView,
  Table,
} from "./types";

// Keeps the previous object wherever an edit left it unchanged.

const sameList = <T>(
  a: readonly T[],
  b: readonly T[],
  same: (x: T, y: T) => boolean,
) => a.length === b.length && a.every((x, i) => same(x, b[i]!));

const sameNumbers = (a: number[] | undefined, b: number[] | undefined) =>
  a === b || (!!a && !!b && sameList(a, b, Object.is));

const sameKey = (a: KeyCell, b: KeyCell) =>
  a.text === b.text &&
  a.key === b.key &&
  a.level === b.level &&
  sameNumbers(a.values, b.values);

const sameCell = (a: Cell, b: Cell): boolean => {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  if ("unknown" in a || "unknown" in b) return "unknown" in a && "unknown" in b;
  if ("keys" in a || "keys" in b)
    return (
      "keys" in a &&
      "keys" in b &&
      a.separator === b.separator &&
      sameList(a.keys, b.keys, sameKey)
    );
  return sameKey(a, b);
};

const sameTable = (a: Table, b: Table) =>
  a.id === b.id &&
  a.section === b.section &&
  a.tab === b.tab &&
  a.label === b.label &&
  a.stretch === b.stretch &&
  sameList(a.columns, b.columns, (x, y) => x[0] === y[0] && x[1] === y[1]) &&
  sameList(
    a.rows,
    b.rows,
    (x, y) => x.id === y.id && sameList(x.cells, y.cells, sameCell),
  );

/** `next` with each item swapped for its match in `prev`; `prev` itself when every item matched. */
function reuseList<T>(
  prev: T[],
  next: T[],
  idOf: (item: T) => string,
  reuse: (prev: T, next: T) => T,
): T[] {
  const byId = new Map(prev.map((item) => [idOf(item), item]));
  const merged = next.map((item) => {
    const old = byId.get(idOf(item));
    return old === undefined ? item : reuse(old, item);
  });
  return sameList(prev, merged, Object.is) ? prev : merged;
}

const reuseTable = (prev: Table, next: Table) =>
  sameTable(prev, next) ? prev : next;

const reuseTables = (prev: Table[], next: Table[]) =>
  reuseList(prev, next, (t) => t.id, reuseTable);

function reuseSet(prev: EquipmentSetView, next: EquipmentSetView) {
  const merged: EquipmentSetView = {
    ...next,
    weapon: reuseTable(prev.weapon, next.weapon),
    wrightstone: reuseTable(prev.wrightstone, next.wrightstone),
    skills: reuseTable(prev.skills, next.skills),
    sigils: reuseTable(prev.sigils, next.sigils),
  };
  const same =
    prev.name === next.name &&
    prev.partySet === next.partySet &&
    prev.characterEntity === next.characterEntity &&
    prev.wrightstoneWeaponId === next.wrightstoneWeaponId &&
    sameList(
      prev.weaponOptions,
      next.weaponOptions,
      (a, b) => a.id === b.id && a.key === b.key && a.series === b.series,
    ) &&
    merged.weapon === prev.weapon &&
    merged.wrightstone === prev.wrightstone &&
    merged.skills === prev.skills &&
    merged.sigils === prev.sigils;
  return same ? prev : merged;
}

function reuseCharacter(prev: CharacterView, next: CharacterView) {
  const merged: CharacterView = {
    ...next,
    tables: reuseTables(prev.tables, next.tables),
    equipment: reuseList(prev.equipment, next.equipment, (s) => s.id, reuseSet),
  };
  const same =
    prev.entity === next.entity &&
    prev.level === next.level &&
    prev.belowMaxLevel === next.belowMaxLevel &&
    prev.overMasteryRolled === next.overMasteryRolled &&
    prev.fateEpisodesIncomplete === next.fateEpisodesIncomplete &&
    merged.tables === prev.tables &&
    merged.equipment === prev.equipment;
  return same ? prev : merged;
}

/** `next` sharing every table, set and character an edit left unchanged with `prev`. */
export const reconcileView = (prev: SaveView, next: SaveView): SaveView => ({
  ...next,
  shared: reuseTables(prev.shared, next.shared),
  party: reuseTables(prev.party, next.party),
  characters: reuseList(
    prev.characters,
    next.characters,
    (c) => c.key,
    reuseCharacter,
  ),
});
