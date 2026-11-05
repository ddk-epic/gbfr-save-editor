import type { UnitStore } from "../../core/unit-store";
import { SAVE_ENTITY } from "../user/attributes";
import {
  TROPHIES_EARNED_IN_RANGE,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
  TROPHY_RANGE_FIRST,
  TROPHY_RANGE_LAST,
} from "./attributes";

/** 1018 for a trophy in Keys 1395-1453, undefined otherwise. */
export const earnedCounter = (badge: number) =>
  badge >= TROPHY_RANGE_FIRST && badge <= TROPHY_RANGE_LAST
    ? TROPHIES_EARNED_IN_RANGE
    : undefined;

/** Copies of 5815 and 5801 that earn trophies as counts are set. */
export function trophyLedger(units: UnitStore) {
  const at = units.of(SAVE_ENTITY);
  const progress = [...at.get(TROPHY_PROGRESS)];
  const earned = [...at.get(TROPHY_EARNED)];
  const earn = (badge: number) => {
    if (earned[badge]) return;
    earned[badge] = true;
    const counter = earnedCounter(badge);
    if (counter !== undefined) progress[counter] = progress[counter]! + 1n;
  };
  return {
    progress,
    earned,
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
