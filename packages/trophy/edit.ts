import { SAVE_ENTITY, type UnitEntity, type Units } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  ACCOUNT_MASTER_LEVEL_BADGES,
  CHARACTER_LEVEL_BADGES,
  CREW_LEVEL_BADGES,
  LAST_RAISED_LEVEL_BADGES,
  MASTER_LEVEL_BADGE_QUANTITIES,
  MASTER_LEVEL_BADGES,
  WEAPON_COLLECTIONS,
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
import {
  CHARACTER_KEY,
  CHARACTER_MAX_LEVEL,
  CAPTAINS,
  crewLevelTotal,
  isCrewMember,
} from "@gbfr/character";
import {
  CREW_LEVEL_TOTAL,
  LAST_RAISED_LEVEL,
  TROPHY_CHARACTER_LEVEL,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  WEAPON_LEVELS_TOTAL,
  WEAPON_UNCAPS,
  WEAPONS_HELD,
  WEAPONS_HELD_ALL,
} from "./attributes";
import { trophyLedger, type TrophyLedger } from "./ledger";

const BONUS_SERIES = 7;
const TERMINUS_SERIES = 0;
const [GRAN, DJEETA] = CAPTAINS;
/** Characters whose trophies leave out weapons from `LATE_WEAPON_VERSION`. */
const LATE_WEAPON_CHARACTERS = new Set(["PL2100", "PL2200", "PL2300"]);
const LATE_WEAPON_VERSION = 5;

const countsForTrophies = (owner: string, { key }: Weapon) =>
  !LATE_WEAPON_CHARACTERS.has(owner) ||
  (WEAPON_ROWS[key]?.unlockVersion ?? 0) < LATE_WEAPON_VERSION;

const trophyOwner = (owner: string) => (owner === DJEETA ? GRAN : owner);

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

/** Writes the ledger's counts and earned trophies. */
export function writeLedger(draft: Draft, ledger: TrophyLedger) {
  const save = draft.of(SAVE_ENTITY);
  save.set(TROPHY_PROGRESS, ledger.progress);
  save.set(TROPHY_EARNED, ledger.earned);
}

/** Earns the trophies of a character joined at the last level. */
export function characterLevelTrophies(draft: Draft, character: string) {
  const { index, progress, badges } = CHARACTER_LEVEL_BADGES[character]!;
  const crewCap = CREW_LEVEL_BADGES.at(-1)![1];
  const ledger = trophyLedger(draft);
  ledger.setTiers(progress, CHARACTER_MAX_LEVEL, badges);
  ledger.setTiers(
    CREW_LEVEL_TOTAL,
    Math.min(crewLevelTotal(draft), crewCap),
    CREW_LEVEL_BADGES,
  );
  ledger.setTiers(
    LAST_RAISED_LEVEL,
    CHARACTER_MAX_LEVEL,
    LAST_RAISED_LEVEL_BADGES,
  );
  recountHeldWeapons(draft, ledger);
  const levels = [...draft.of(SAVE_ENTITY).get(TROPHY_CHARACTER_LEVEL)];
  levels[index] = CHARACTER_MAX_LEVEL;
  writeLedger(draft, ledger);
  draft.of(SAVE_ENTITY).set(TROPHY_CHARACTER_LEVEL, levels);
}

/** Earns a character's master level badges and the account's. */
export function masterLevelTrophies(draft: Draft, character: string) {
  const badges = MASTER_LEVEL_BADGES[character]!;
  const earned = [...draft.of(SAVE_ENTITY).get(TROPHY_EARNED)];
  const progress = [...draft.of(SAVE_ENTITY).get(TROPHY_PROGRESS)];
  // ReqQuantity 1 badges write no progress.
  for (const [badge, behavior, quantity] of [
    ...badges.map(
      ([key, progress], i) =>
        [key, progress, MASTER_LEVEL_BADGE_QUANTITIES[i]!] as const,
    ),
    ...ACCOUNT_MASTER_LEVEL_BADGES,
  ]) {
    earned[badge] = true;
    if (quantity > 1 && progress[behavior]! < BigInt(quantity))
      progress[behavior] = BigInt(quantity);
  }
  const save = draft.of(SAVE_ENTITY);
  save.set(TROPHY_EARNED, earned);
  save.set(TROPHY_PROGRESS, progress);
}

/** Earns the trophies of a weapon of `character` just forged in `series`. */
export function forgedWeaponTrophies(
  draft: Draft,
  character: string,
  series: number,
) {
  const counted = [...readOwnedWeapons(draft).get(character)!.values()].filter(
    (weapon) => countsForTrophies(character, weapon),
  );
  const ledger = trophyLedger(draft);
  recountHeldWeapons(draft, ledger);
  const owner = trophyOwner(character);
  const collection = WEAPON_COLLECTIONS[owner];
  if (collection) ledger.setOwn(collection, counted.length);
  const trove = WEAPON_TROVES[owner];
  if (trove && series === TERMINUS_SERIES)
    ledger.setOwn(
      trove,
      counted.filter(
        (weapon) =>
          weapon.series === TERMINUS_SERIES ||
          weapon.uncap >= WEAPON_LAST_UNCAP,
      ).length,
    );
  writeLedger(draft, ledger);
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
