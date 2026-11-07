import { EMPTY_HASH } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import {
  WEAPON_COLLECTIONS,
  WEAPON_KEYS,
  WEAPON_LEVEL_XP,
  WEAPON_LEVELS_TOTAL_BADGES,
  WEAPON_ROWS,
  WEAPON_TROVES,
  WEAPON_UNCAPS_BADGES,
  WEAPONS_HELD_ALL_BADGES,
  WEAPONS_HELD_BADGES,
} from "../../data/weapons";
import type { Patch, SaveSession } from "../../core/session";
import { CHARACTER_FLAGS, CHARACTER_KEY } from "../character/attributes";
import { offPlayCaptain } from "../character/read";
import {
  FIELD_NOTE_WEAPON_FLAGS,
  FIELD_NOTE_WEAPON_KEY,
} from "../journal/attributes";
import {
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  WEAPON_LEVELS_TOTAL,
  WEAPON_UNCAPS,
  WEAPONS_HELD,
  WEAPONS_HELD_ALL,
} from "../trophy/attributes";
import { trophyLedger, type TrophyLedger } from "../trophy/ledger";
import { SAVE_ENTITY } from "../../core/save-entity";
import {
  TRAIT_KEY,
  TRAIT_LEVEL,
  TRAIT_WEAPON,
  traitRange,
} from "../trait/attributes";
import {
  findWeaponById,
  readOwnedWeapons,
  readWeapons,
  type Weapon,
  weaponLevelOf,
} from "./read";
import {
  COLLECTION_SERIES,
  WEAPON_FIRST,
  WEAPON_FLAGS,
  WEAPON_ID,
  WEAPON_KEY,
  WEAPON_LAST_ID,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "./attributes";

const LAST_UNCAP = 6;
const LAST_LEVEL = 150;
const LAST_XP = WEAPON_LEVEL_XP[LAST_LEVEL - 1]!;
const BONUS_SERIES = 7;
const TERMINUS_SERIES = 0;
const GRAN = "PL0000";
const DJEETA = "PL0100";
const JOINED_MASK = 3;
const JOINED = 1;
const FORGED_FLAGS = 128;
const FIELD_NOTE_UNLOCKED = 4;
/** weapon.Key to hash, a DLC key being its hash in hex. */
const WEAPON_HASHES = new Map(
  Object.entries(WEAPON_KEYS).map(([hash, key]) => [key, Number(hash)]),
);
/** Characters whose trophies leave out weapons from `LATE_WEAPON_VERSION`. */
const LATE_WEAPON_CHARACTERS = new Set(["PL2100", "PL2200", "PL2300"]);
const LATE_WEAPON_VERSION = 5;

const countsForTrophies = (owner: string, { key }: Weapon) =>
  !LATE_WEAPON_CHARACTERS.has(owner) ||
  (WEAPON_ROWS[key]?.unlockVersion ?? 0) < LATE_WEAPON_VERSION;

const trophyOwner = (owner: string) => (owner === DJEETA ? GRAN : owner);

const joinedCharacters = (units: UnitStore) =>
  new Set(
    units
      .entitiesWith(CHARACTER_KEY)
      .filter(
        (entity) =>
          (units.of(entity).get(CHARACTER_FLAGS) & JOINED_MASK) === JOINED,
      )
      .map((entity) => units.of(entity).get(CHARACTER_KEY)),
  );

/** Summed levels of joined characters' held weapons. */
const levelsTotalOf = (units: UnitStore, raised: ReadonlySet<UnitEntity>) => {
  const joined = joinedCharacters(units);
  return [...readWeapons(units).values()]
    .filter(
      (weapon) =>
        weapon.owned &&
        weapon.series !== undefined &&
        weapon.series !== BONUS_SERIES &&
        joined.has(weapon.character),
    )
    .reduce(
      (total, { entity, xp }) =>
        total + (raised.has(entity) ? LAST_LEVEL : weaponLevelOf(xp)),
      0,
    );
};

/** Recounts 184, 998 and 185 over joined characters' held weapons. */
export function recountHeldWeapons(units: UnitStore, ledger: TrophyLedger) {
  const joined = joinedCharacters(units);
  const heldTotal = [...readOwnedWeapons(units)]
    .filter(([owner]) => joined.has(owner))
    .reduce((total, [, series]) => total + series.size, 0);
  ledger.setTiers(WEAPONS_HELD, heldTotal, WEAPONS_HELD_BADGES);
  ledger.setTiers(WEAPONS_HELD_ALL, heldTotal, WEAPONS_HELD_ALL_BADGES);
  ledger.setTiers(
    WEAPON_LEVELS_TOTAL,
    levelsTotalOf(units, new Set()),
    WEAPON_LEVELS_TOTAL_BADGES,
  );
}

/** The weapons a character can still gain, one per missing series. */
export function unlockableWeapons(units: UnitStore, character: UnitEntity) {
  const owner = units.of(character).get(CHARACTER_KEY);
  if (owner === undefined || owner === offPlayCaptain(units)) return [];
  const held = readOwnedWeapons(units).get(owner);
  return Object.entries(WEAPON_ROWS)
    .filter(
      ([, row]) =>
        row.forged && row.character === owner && !held?.has(row.series),
    )
    .map(([key, { series }]) => ({ key, series }))
    .sort(
      (a, b) =>
        COLLECTION_SERIES.indexOf(a.series) -
        COLLECTION_SERIES.indexOf(b.series),
    );
}

export const canUnlockWeaponSeries = (
  units: UnitStore,
  character: UnitEntity,
) => unlockableWeapons(units, character).length > 0;

/** Adds one weapon as a forge does, at no cost. */
export function unlockWeapon(
  session: SaveSession,
  character: UnitEntity,
  key: string,
) {
  const units = session.save.slotData.units;
  if (!unlockableWeapons(units, character).some((w) => w.key === key))
    throw new Error(`character ${character} cannot unlock ${key}`);
  const row = WEAPON_ROWS[key]!;
  const [uncap, level] = row.forged!;
  const entity = units.entitiesWhere(WEAPON_ID, 0)[0];
  if (entity === undefined) throw new Error("no free weapon entry");
  const id = units.of(SAVE_ENTITY).get(WEAPON_LAST_ID) + 1;
  const hash = WEAPON_HASHES.get(key)!;
  const note = units.entitiesWhere(FIELD_NOTE_WEAPON_KEY, hash)[0];
  session.patch([
    { attribute: WEAPON_LAST_ID, entity: SAVE_ENTITY, values: [id] },
    { attribute: WEAPON_ID, entity, values: [id] },
    { attribute: WEAPON_KEY, entity, values: [hash] },
    { attribute: WEAPON_XP, entity, values: [WEAPON_LEVEL_XP[level - 1]!] },
    { attribute: WEAPON_UNCAP, entity, values: [uncap] },
    { attribute: WEAPON_FLAGS, entity, values: [FORGED_FLAGS] },
    ...(note === undefined
      ? []
      : [
          {
            attribute: FIELD_NOTE_WEAPON_FLAGS,
            entity: note,
            values: [
              Number(units.values(FIELD_NOTE_WEAPON_FLAGS, note)![0]) |
                FIELD_NOTE_UNLOCKED,
            ],
          },
        ]),
  ]);

  const counted = [
    ...readOwnedWeapons(units).get(row.character)!.values(),
  ].filter((weapon) => countsForTrophies(row.character, weapon));
  const ledger = trophyLedger(units);
  recountHeldWeapons(units, ledger);
  const owner = trophyOwner(row.character);
  const collection = WEAPON_COLLECTIONS[owner];
  if (collection) ledger.setOwn(collection, counted.length);
  const trove = WEAPON_TROVES[owner];
  if (trove && row.series === TERMINUS_SERIES)
    ledger.setOwn(
      trove,
      counted.filter(
        (weapon) =>
          weapon.series === TERMINUS_SERIES || weapon.uncap >= LAST_UNCAP,
      ).length,
    );
  session.patch([
    {
      attribute: TROPHY_PROGRESS,
      entity: SAVE_ENTITY,
      values: ledger.progress,
    },
    { attribute: TROPHY_EARNED, entity: SAVE_ENTITY, values: ledger.earned },
  ]);
}

export function unlockWeaponSeries(
  session: SaveSession,
  character: UnitEntity,
) {
  const units = session.save.slotData.units;
  for (const { key } of unlockableWeapons(units, character))
    unlockWeapon(session, character, key);
}

/** The writes `maxWeaponSeries` makes on a character's held weapons. */
function planWeaponSeries(units: UnitStore, character: UnitEntity) {
  const key = units.of(character).get(CHARACTER_KEY);
  if (key === undefined) return undefined;
  const series = [...(readOwnedWeapons(units).get(key)?.values() ?? [])];
  if (series.length === 0) return undefined;
  const raised = series.filter(
    ({ uncap, xp }) => uncap < LAST_UNCAP || xp < LAST_XP,
  );
  const raisedEntities = new Set(raised.map(({ entity }) => entity));

  const ledger = trophyLedger(units);
  const { progress, earned } = ledger;
  ledger.setTiers(
    WEAPON_LEVELS_TOTAL,
    levelsTotalOf(units, raisedEntities),
    WEAPON_LEVELS_TOTAL_BADGES,
  );
  ledger.setTiers(
    WEAPON_UNCAPS,
    Number(progress[WEAPON_UNCAPS]!) +
      raised.reduce((total, { uncap }) => total + LAST_UNCAP - uncap, 0),
    WEAPON_UNCAPS_BADGES,
  );

  const trove = WEAPON_TROVES[trophyOwner(key)];
  if (trove)
    ledger.setOwn(
      trove,
      series.filter(
        (weapon) =>
          countsForTrophies(key, weapon) &&
          (raisedEntities.has(weapon.entity) || weapon.uncap >= LAST_UNCAP),
      ).length,
    );

  const at = units.of(SAVE_ENTITY);
  const before = at.get(TROPHY_PROGRESS);
  const beforeEarned = at.get(TROPHY_EARNED);
  return {
    raised,
    progress,
    earned,
    changed:
      raised.length > 0 ||
      progress.some((value, index) => value !== before[index]) ||
      earned.some((value, index) => value !== beforeEarned[index]),
  };
}

/** True while `maxWeaponSeries` would change the save. */
export const canMaxWeaponSeries = (units: UnitStore, character: UnitEntity) =>
  canUnlockWeaponSeries(units, character) ||
  (planWeaponSeries(units, character)?.changed ?? false);

/** Unlocks missing weapons, raises the series and earns the trophies met. */
export function maxWeaponSeries(session: SaveSession, character: UnitEntity) {
  unlockWeaponSeries(session, character);
  const plan = planWeaponSeries(session.save.slotData.units, character);
  if (!plan?.changed)
    throw new Error(`character ${character} has no weapon series to raise`);
  const patches: Patch[] = plan.raised.flatMap(({ entity }) => [
    { attribute: WEAPON_UNCAP, entity, values: [LAST_UNCAP] },
    { attribute: WEAPON_XP, entity, values: [LAST_XP] },
  ]);
  patches.push(
    { attribute: TROPHY_PROGRESS, entity: SAVE_ENTITY, values: plan.progress },
    { attribute: TROPHY_EARNED, entity: SAVE_ENTITY, values: plan.earned },
  );
  session.patch(patches);
}

export function removeWrightstone(session: SaveSession, weaponId: number) {
  const units = session.save.slotData.units;
  const entity = findWeaponById(units, weaponId);
  if (entity === undefined) throw new Error(`no weapon with id ${weaponId}`);
  if (units.of(entity).get(WEAPON_WRIGHTSTONE) === undefined)
    throw new Error(`weapon ${weaponId} has no wrightstone`);

  const traits = units.entitiesWith(
    TRAIT_KEY,
    traitRange(TRAIT_WEAPON + entity - WEAPON_FIRST),
  );
  session.patch([
    { attribute: WEAPON_WRIGHTSTONE, entity, values: [EMPTY_HASH] },
    ...traits.flatMap((trait) => [
      { attribute: TRAIT_KEY, entity: trait, values: [EMPTY_HASH] },
      { attribute: TRAIT_LEVEL, entity: trait, values: [0] },
    ]),
  ]);
}
