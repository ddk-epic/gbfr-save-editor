import { type UnitEntity, type Units, SAVE_ENTITY } from "@gbfr/core";
import {
  WEAPON_LEVELS_TOTAL_BADGES,
  WEAPON_TROVES,
  WEAPON_UNCAPS_BADGES,
  WEAPONS_HELD_ALL_BADGES,
  WEAPONS_HELD_BADGES,
} from "./data.gen";
import {
  WEAPON_ROWS,
  readOwnedWeapons,
  readWeapons,
  weaponLevelOf,
  type Weapon,
  WEAPON_LAST_LEVEL,
  WEAPON_LAST_UNCAP,
} from "@gbfr/weapon";
import { CHARACTER_KEY, CAPTAINS, isCrewMember } from "@gbfr/character";
import {
  TROPHIES_EARNED_IN_RANGE,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  TROPHY_RANGE_FIRST,
  TROPHY_RANGE_LAST,
  WEAPON_LEVELS_TOTAL,
  WEAPON_UNCAPS,
  WEAPONS_HELD,
  WEAPONS_HELD_ALL,
} from "./attributes";

/** 1018 for a trophy in Keys 1395-1453, undefined otherwise. */
export const earnedCounter = (badge: number) =>
  badge >= TROPHY_RANGE_FIRST && badge <= TROPHY_RANGE_LAST
    ? TROPHIES_EARNED_IN_RANGE
    : undefined;

/** Copies of 5815 and 5801 that earn trophies as counts are set. */
export function trophyLedger(units: Units) {
  const at = units.of(SAVE_ENTITY);
  const progress = [...at.get(TROPHY_PROGRESS)];
  const earned = [...at.get(TROPHY_EARNED)];
  const earn = (badge: number) => {
    if (earned[badge]) return false;
    earned[badge] = true;
    const counter = earnedCounter(badge);
    if (counter !== undefined) progress[counter] = progress[counter]! + 1n;
    return true;
  };
  return {
    progress,
    earned,
    earn,
    setTiers(
      index: number,
      count: number,
      badges: readonly (readonly [badge: number, quantity: number])[],
    ) {
      progress[index] = BigInt(count);
      for (const [badge, quantity] of badges)
        if (count >= quantity) earn(badge);
    },
    setOwn(
      [index, badge, quantity]: readonly [number, number, number],
      count: number,
    ) {
      progress[index] = BigInt(count);
      if (count >= quantity) earn(badge);
    },
  };
}

export type TrophyLedger = ReturnType<typeof trophyLedger>;

const BONUS_SERIES = 7;
const [GRAN, DJEETA] = CAPTAINS;
/** Characters whose trophies leave out weapons from `LATE_WEAPON_VERSION`. */
const LATE_WEAPON_CHARACTERS = new Set(["PL2100", "PL2200", "PL2300"]);
const LATE_WEAPON_VERSION = 5;

export const countsForTrophies = (owner: string, { key }: Weapon) =>
  !LATE_WEAPON_CHARACTERS.has(owner) ||
  (WEAPON_ROWS[key]?.unlockVersion ?? 0) < LATE_WEAPON_VERSION;

export const trophyOwner = (owner: string) => (owner === DJEETA ? GRAN : owner);

const joinedKeys = (units: Units) =>
  new Set(
    units
      .entitiesWith(CHARACTER_KEY)
      .filter((entity) => isCrewMember(units, entity))
      .map((entity) => units.of(entity).get(CHARACTER_KEY)),
  );

/** Summed levels of joined characters' held weapons. */
const levelsTotalOf = (units: Units, raised: ReadonlySet<UnitEntity>) => {
  const joined = joinedKeys(units);
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
        total + (raised.has(entity) ? WEAPON_LAST_LEVEL : weaponLevelOf(xp)),
      0,
    );
};

/** Recounts 184, 998 and 185 over joined characters' held weapons. */
export function recountHeldWeapons(units: Units, ledger: TrophyLedger) {
  const joined = joinedKeys(units);
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

/** The ledger with `raised` weapons at the last uncap and level, and whether it differs from the save. */
export function raisedWeaponTrophies(
  units: Units,
  character: string,
  held: readonly Weapon[],
  raised: readonly Weapon[],
) {
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
      raised.reduce((total, { uncap }) => total + WEAPON_LAST_UNCAP - uncap, 0),
    WEAPON_UNCAPS_BADGES,
  );

  const trove = WEAPON_TROVES[trophyOwner(character)];
  if (trove)
    ledger.setOwn(
      trove,
      held.filter(
        (weapon) =>
          countsForTrophies(character, weapon) &&
          (raisedEntities.has(weapon.entity) ||
            weapon.uncap >= WEAPON_LAST_UNCAP),
      ).length,
    );

  const at = units.of(SAVE_ENTITY);
  const before = at.get(TROPHY_PROGRESS);
  const beforeEarned = at.get(TROPHY_EARNED);
  return {
    ledger,
    changed:
      progress.some((value, index) => value !== before[index]) ||
      earned.some((value, index) => value !== beforeEarned[index]),
  };
}
