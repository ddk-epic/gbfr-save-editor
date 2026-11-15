import { SAVE_ENTITY } from "@gbfr/core";
import type { Draft } from "@gbfr/core/draft";
import {
  ACCOUNT_MASTER_LEVEL_BADGES,
  CHARACTER_LEVEL_BADGES,
  CREW_LEVEL_BADGES,
  LAST_RAISED_LEVEL_BADGES,
  MASTER_LEVEL_BADGE_QUANTITIES,
  MASTER_LEVEL_BADGES,
  WEAPON_COLLECTIONS,
  WEAPON_TROVES,
} from "./data.gen";
import { readOwnedWeapons, WEAPON_LAST_UNCAP } from "@gbfr/weapon";
import { CHARACTER_MAX_LEVEL, crewLevelTotal } from "@gbfr/character";
import {
  CHAOS_QUEST_CLEARS,
  CREW_LEVEL_TOTAL,
  LAST_RAISED_LEVEL,
  PROUD_QUEST_CLEARS,
  QUEST_CLEARS_BEFORE_DIFFICULTY,
  QUESTS_CLEARED,
  TROPHY_CHARACTER_LEVEL,
  TROPHY_EARNED,
  TROPHY_PROGRESS,
} from "./attributes";
import { difficultyDigit } from "@gbfr/quest";
import {
  countsForTrophies,
  recountHeldWeapons,
  trophyLedger,
  trophyOwner,
  type TrophyLedger,
} from "./ledger";

const TERMINUS_SERIES = 0;

/** Writes the ledger's counts and earned trophies. */
export function writeLedger(draft: Draft, ledger: TrophyLedger) {
  const save = draft.of(SAVE_ENTITY);
  save.set(TROPHY_PROGRESS, ledger.progress);
  save.set(TROPHY_EARNED, ledger.earned);
}

/** Earns a trophy, and returns whether it was not earned. */
export function earnTrophy(draft: Draft, badge: number) {
  const ledger = trophyLedger(draft);
  if (!ledger.earn(badge)) return false;
  writeLedger(draft, ledger);
  return true;
}

/** Raises a progress count by `amount`. */
export function addProgress(draft: Draft, index: number, amount: number) {
  const progress = [...draft.of(SAVE_ENTITY).get(TROPHY_PROGRESS)];
  progress[index] = progress[index]! + BigInt(amount);
  draft.of(SAVE_ENTITY).set(TROPHY_PROGRESS, progress);
}

export function setProgress(draft: Draft, index: number, value: bigint) {
  const progress = [...draft.of(SAVE_ENTITY).get(TROPHY_PROGRESS)];
  progress[index] = value;
  draft.of(SAVE_ENTITY).set(TROPHY_PROGRESS, progress);
}

/** Raises a progress count to `value` when it is lower. */
export function raiseProgress(draft: Draft, index: number, value: bigint) {
  if (draft.of(SAVE_ENTITY).get(TROPHY_PROGRESS)[index]! < value)
    setProgress(draft, index, value);
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

/** Raises the per-difficulty and total quest clear counters for each cleared quest. */
export function countQuestClears(draft: Draft, quests: readonly number[]) {
  if (quests.length === 0) return;
  const at = draft.of(SAVE_ENTITY);
  const progress = [...at.get(TROPHY_PROGRESS)];
  for (const quest of quests) {
    const digit = (quest >> 12) & 0xf;
    const counter =
      digit === difficultyDigit("proud")
        ? PROUD_QUEST_CLEARS
        : digit >= difficultyDigit("chaos")
          ? CHAOS_QUEST_CLEARS + digit - difficultyDigit("chaos")
          : QUEST_CLEARS_BEFORE_DIFFICULTY + digit;
    progress[counter] = progress[counter]! + 1n;
    progress[QUESTS_CLEARED] = progress[QUESTS_CLEARED]! + 1n;
  }
  at.set(TROPHY_PROGRESS, progress);
}
