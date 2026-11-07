import type { Patch } from "../../core/session";
import { SAVE_ENTITY } from "../../core/save-entity";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import {
  ACCOUNT_MASTER_LEVEL_BADGES,
  CHARACTER_LEVEL_BADGES,
  CREW_LEVEL_BADGES,
  LAST_RAISED_LEVEL_BADGES,
  MASTER_LEVEL_BADGE_QUANTITIES,
  MASTER_LEVEL_BADGES,
} from "../../data/characters";
import {
  WEAPON_COLLECTIONS,
  WEAPON_LEVELS_TOTAL_BADGES,
  WEAPON_ROWS,
  WEAPON_TROVES,
  WEAPON_UNCAPS_BADGES,
  WEAPONS_HELD_ALL_BADGES,
  WEAPONS_HELD_BADGES,
} from "../../data/weapons";
import { CHARACTER_KEY, CHARACTER_MAX_LEVEL } from "../character/attributes";
import { CAPTAINS, crewLevelTotal, isCrewMember } from "../character/read";
import {
  readOwnedWeapons,
  readWeapons,
  weaponLevelOf,
  type Weapon,
} from "../weapon/read";
import { WEAPON_LAST_LEVEL, WEAPON_LAST_UNCAP } from "../weapon/attributes";
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

const joinedKeys = (units: UnitStore) =>
  new Set(
    units
      .entitiesWith(CHARACTER_KEY)
      .filter((entity) => isCrewMember(units, entity))
      .map((entity) => units.of(entity).get(CHARACTER_KEY)),
  );

/** Summed levels of joined characters' held weapons. */
const levelsTotalOf = (units: UnitStore, raised: ReadonlySet<UnitEntity>) => {
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
export function recountHeldWeapons(units: UnitStore, ledger: TrophyLedger) {
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

const ledgerPatches = (units: UnitStore, ledger: TrophyLedger): Patch[] => {
  const save = units.of(SAVE_ENTITY);
  return [
    save.patch(TROPHY_PROGRESS, ledger.progress),
    save.patch(TROPHY_EARNED, ledger.earned),
  ];
};

/** Patches for a character joined at the last level, read after the join is applied. */
export function characterLevelTrophies(
  units: UnitStore,
  character: string,
): Patch[] {
  const { index, progress, badges } = CHARACTER_LEVEL_BADGES[character]!;
  const crewCap = CREW_LEVEL_BADGES.at(-1)![1];
  const ledger = trophyLedger(units);
  ledger.setTiers(progress, CHARACTER_MAX_LEVEL, badges);
  ledger.setTiers(
    CREW_LEVEL_TOTAL,
    Math.min(crewLevelTotal(units), crewCap),
    CREW_LEVEL_BADGES,
  );
  ledger.setTiers(
    LAST_RAISED_LEVEL,
    CHARACTER_MAX_LEVEL,
    LAST_RAISED_LEVEL_BADGES,
  );
  recountHeldWeapons(units, ledger);
  const levels = [...units.of(SAVE_ENTITY).get(TROPHY_CHARACTER_LEVEL)];
  levels[index] = CHARACTER_MAX_LEVEL;
  return [
    ...ledgerPatches(units, ledger),
    units.of(SAVE_ENTITY).patch(TROPHY_CHARACTER_LEVEL, levels),
  ];
}

/** Patches earning a character's master level badges and the account's. */
export function masterLevelTrophies(
  units: UnitStore,
  character: string,
): Patch[] {
  const badges = MASTER_LEVEL_BADGES[character]!;
  const earned = [...units.of(SAVE_ENTITY).get(TROPHY_EARNED)];
  const progress = [...units.of(SAVE_ENTITY).get(TROPHY_PROGRESS)];
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
  const save = units.of(SAVE_ENTITY);
  return [
    save.patch(TROPHY_EARNED, earned),
    save.patch(TROPHY_PROGRESS, progress),
  ];
}

/** Patches for a weapon of `character` just forged in `series`, read after the forge is applied. */
export function forgedWeaponTrophies(
  units: UnitStore,
  character: string,
  series: number,
): Patch[] {
  const counted = [...readOwnedWeapons(units).get(character)!.values()].filter(
    (weapon) => countsForTrophies(character, weapon),
  );
  const ledger = trophyLedger(units);
  recountHeldWeapons(units, ledger);
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
  return ledgerPatches(units, ledger);
}

/** Patches for `raised` weapons of a character taken to the last uncap and level, and whether they differ from the save. */
export function raisedWeaponTrophies(
  units: UnitStore,
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
    patches: ledgerPatches(units, ledger),
    changed:
      progress.some((value, index) => value !== before[index]) ||
      earned.some((value, index) => value !== beforeEarned[index]),
  };
}
