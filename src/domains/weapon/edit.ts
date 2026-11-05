import { EMPTY_HASH } from "../../core/keys";
import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import {
  WEAPON_LEVEL_XP,
  WEAPON_LEVELS_TOTAL_BADGES,
  WEAPON_TROVES,
  WEAPON_UNCAPS_BADGES,
} from "../../data/weapons";
import type { Patch, SaveSession } from "../../save/session";
import { CHARACTER_FLAGS, CHARACTER_KEY } from "../character/attributes";
import {
  TROPHIES_EARNED_OUTSIDE_RANGE,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  WEAPON_LEVELS_TOTAL,
  WEAPON_UNCAPS,
} from "../trophy/attributes";
import { SAVE_ENTITY } from "../user/attributes";
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
  weaponLevelOf,
} from "./read";
import {
  WEAPON_FIRST,
  WEAPON_UNCAP,
  WEAPON_WRIGHTSTONE,
  WEAPON_XP,
} from "./attributes";

const LAST_UNCAP = 6;
const LAST_LEVEL = 150;
const LAST_XP = WEAPON_LEVEL_XP[LAST_LEVEL - 1]!;
const BONUS_SERIES = 7;
const GRAN = "PL0000";
const DJEETA = "PL0100";
const JOINED_MASK = 3;
const JOINED = 1;

/** The writes `maxWeaponSeries` makes on a character. */
function planWeaponSeries(units: UnitStore, character: UnitEntity) {
  const key = units.of(character).get(CHARACTER_KEY);
  if (key === undefined) return undefined;
  const series = [...(readOwnedWeapons(units).get(key)?.values() ?? [])];
  if (series.length === 0) return undefined;
  const raised = series.filter(
    ({ uncap, xp }) => uncap < LAST_UNCAP || xp < LAST_XP,
  );
  const raisedEntities = new Set(raised.map(({ entity }) => entity));

  const at = units.of(SAVE_ENTITY);
  const joined = new Set(
    units
      .entitiesWith(CHARACTER_KEY)
      .filter(
        (entity) =>
          (units.of(entity).get(CHARACTER_FLAGS) & JOINED_MASK) === JOINED,
      )
      .map((entity) => units.of(entity).get(CHARACTER_KEY)),
  );
  const levelsTotal = [...readWeapons(units).values()]
    .filter(
      (weapon) =>
        weapon.owned &&
        weapon.series !== undefined &&
        weapon.series !== BONUS_SERIES &&
        joined.has(weapon.character),
    )
    .reduce(
      (total, { entity, xp }) =>
        total + (raisedEntities.has(entity) ? LAST_LEVEL : weaponLevelOf(xp)),
      0,
    );

  const progress = [...at.get(TROPHY_PROGRESS)];
  const earned = [...at.get(TROPHY_EARNED)];
  const earn = (badge: number) => {
    if (earned[badge]) return;
    earned[badge] = true;
    progress[TROPHIES_EARNED_OUTSIDE_RANGE] =
      progress[TROPHIES_EARNED_OUTSIDE_RANGE]! + 1n;
  };
  const earnTiers = (
    index: number,
    badges: readonly (readonly [badge: number, quantity: number])[],
  ) => {
    for (const [badge, quantity] of badges)
      if (progress[index]! >= BigInt(quantity)) earn(badge);
  };

  progress[WEAPON_LEVELS_TOTAL] = BigInt(levelsTotal);
  earnTiers(WEAPON_LEVELS_TOTAL, WEAPON_LEVELS_TOTAL_BADGES);
  progress[WEAPON_UNCAPS] =
    progress[WEAPON_UNCAPS]! +
    BigInt(raised.reduce((total, { uncap }) => total + LAST_UNCAP - uncap, 0));
  earnTiers(WEAPON_UNCAPS, WEAPON_UNCAPS_BADGES);

  const trove = WEAPON_TROVES[key === DJEETA ? GRAN : key];
  if (trove) {
    const [index, badge, quantity] = trove;
    progress[index] = BigInt(
      series.filter(
        ({ entity, uncap }) =>
          raisedEntities.has(entity) || uncap >= LAST_UNCAP,
      ).length,
    );
    if (progress[index]! >= BigInt(quantity)) earn(badge);
  }

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
  planWeaponSeries(units, character)?.changed ?? false;

/** Raises a character's held weapon series, corrects the weapon counts and earns their trophies. */
export function maxWeaponSeries(session: SaveSession, character: UnitEntity) {
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
