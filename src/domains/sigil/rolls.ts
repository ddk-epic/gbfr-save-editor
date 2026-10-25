import {
  GEM_ROWS,
  SIGIL_RARITY_LEVELS,
  SIGIL_SECONDARIES,
  TRAIT_INVENTORY_SORT_ORDER,
  type Gem,
} from "../../data/sigils";

export interface SigilRoll {
  level: number;
  /** skill.Key */
  primary: string;
  /** skill.Key, "" for none. */
  secondary: string;
}

const traitOrder = (key: string) => TRAIT_INVENTORY_SORT_ORDER[key] ?? Infinity;
const byTraitOrder = (a: string, b: string) => traitOrder(a) - traitOrder(b);

/** Every sigil level with its rarity. */
export const SIGIL_LEVELS: readonly { level: number; rarity: number }[] =
  Object.entries(SIGIL_RARITY_LEVELS).flatMap(([rarity, [min, max]]) =>
    Array.from({ length: max - min + 1 }, (_, i) => ({
      level: min + i,
      rarity: Number(rarity),
    })),
  );

const rarityOf = (level: number) =>
  SIGIL_LEVELS.find((entry) => entry.level === level)?.rarity;

const twoTrait = (gem: Gem) => gem.traits.length > 1 || !!gem.rollsSecond;

/** Gem keys at a level's rarity, without hidden-level gems. */
const gemsAt = (level: number) =>
  Object.keys(GEM_ROWS).filter(
    (key) =>
      !GEM_ROWS[key]!.hideLevel && GEM_ROWS[key]!.rarity === rarityOf(level),
  );

/** Primary traits with a sigil at the level, in inventory order. */
export const sigilPrimaries = (level: number): string[] =>
  [...new Set(gemsAt(level).map((key) => GEM_ROWS[key]!.traits[0]!))].sort(
    byTraitOrder,
  );

/** The second traits a primary takes at the level, "" for none, in inventory order. */
export function sigilSecondaries(primary: string, level: number): string[] {
  const gems = gemsAt(level)
    .map((key) => GEM_ROWS[key]!)
    .filter((gem) => gem.traits[0] === primary);
  return [
    ...(gems.some((gem) => !twoTrait(gem)) ? [""] : []),
    ...(gems.some(twoTrait) ? [...SIGIL_SECONDARIES].sort(byTraitOrder) : []),
  ];
}

/** Whether gem `key` fits the roll. */
function fits(key: string, { level, primary, secondary }: SigilRoll) {
  const gem = GEM_ROWS[key];
  return (
    gem !== undefined &&
    !gem.hideLevel &&
    gem.rarity === rarityOf(level) &&
    gem.traits[0] === primary &&
    twoTrait(gem) === (secondary !== "")
  );
}

/** The gem for a roll, `current` when it fits. */
export function sigilGem(
  roll: SigilRoll,
  current?: string,
): string | undefined {
  if (roll.secondary !== "" && !SIGIL_SECONDARIES.includes(roll.secondary))
    return undefined;
  if (current !== undefined && fits(current, roll)) return current;
  // Named keys before the hash-only ones.
  const keys = gemsAt(roll.level)
    .filter((key) => fits(key, roll))
    .sort(
      (a, b) =>
        Number(!a.startsWith("GEEN_")) - Number(!b.startsWith("GEEN_")) ||
        a.localeCompare(b),
    );
  return (
    keys.find((key) => GEM_ROWS[key]!.traits[1] === roll.secondary) ??
    keys.find((key) => GEM_ROWS[key]!.rollsSecond) ??
    keys[0]
  );
}
