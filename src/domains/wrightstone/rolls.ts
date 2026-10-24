import type { Trait } from "../trait/read";

const skills = (ids: number[]) =>
  ids.map((id) => `SKILL_${String(id).padStart(3, "0")}_00`);

/** By the `<f>` of `ITEM_<f>_0130` and `_0131`. */
export const WRIGHTSTONE_MAINS = {
  25: "SKILL_004_00",
  26: "SKILL_003_00",
  27: "SKILL_001_00",
  28: "SKILL_014_00",
} as const;

export type WrightstoneFamily = keyof typeof WRIGHTSTONE_MAINS;

export const WRIGHTSTONE_PRESETS = {
  top: { tier: "0131", levels: [20, 15, 10] },
  high: { tier: "0130", levels: [15, 10, 7] },
  low: { tier: "0130", levels: [10, 7, 5] },
} as const;

export type WrightstonePreset = keyof typeof WRIGHTSTONE_PRESETS;

/** `skill_type_lot` 22-25, by `skill_lot` group. */
export const WRIGHTSTONE_SUB_GROUPS = {
  basic: skills([0, 1, 3, 4]),
  attack: skills([
    5, 6, 8, 9, 12, 13, 14, 17, 18, 20, 24, 27, 28, 29, 30, 31, 61, 64, 83, 110,
    111,
  ]),
  defense: skills([
    36, 46, 47, 51, 52, 54, 55, 57, 58, 60, 85, 86, 87, 88, 96, 104, 107, 136,
    137, 138, 139,
  ]),
  support: skills([65, 66, 67, 69, 70, 72, 106, 109]),
  utility: skills([45, 68, 73, 77, 78, 79, 80, 94]),
  endless: skills([144, 145, 147, 151, 152, 153, 154, 158, 166]),
} as const;

export interface WrightstoneRoll {
  family: WrightstoneFamily;
  preset: WrightstonePreset;
  subs: readonly [string, string];
}

export const wrightstoneKey = ({ family, preset }: WrightstoneRoll) =>
  `ITEM_${family}_${WRIGHTSTONE_PRESETS[preset].tier}`;

/** The sub traits a family rolls: every group's, less its main. */
export const wrightstoneSubs = (family: WrightstoneFamily): string[] =>
  Object.values(WRIGHTSTONE_SUB_GROUPS)
    .flat()
    .filter((key) => key !== WRIGHTSTONE_MAINS[family]);

/** The roll a stone matches, undefined for a lower tier or other levels. */
export function wrightstoneRoll(
  key: string,
  traits: readonly Trait[],
): WrightstoneRoll | undefined {
  const match = /^ITEM_(\d+)_(013[01])$/.exec(key);
  const family = Number(match?.[1]) as WrightstoneFamily;
  if (!match || !(family in WRIGHTSTONE_MAINS) || traits.length !== 3)
    return undefined;
  const [main, sub1, sub2] = traits as [Trait, Trait, Trait];
  const preset = (Object.keys(WRIGHTSTONE_PRESETS) as WrightstonePreset[]).find(
    (name) =>
      WRIGHTSTONE_PRESETS[name].tier === match[2] &&
      WRIGHTSTONE_PRESETS[name].levels.every(
        (level, i) => traits[i]!.level === level,
      ),
  );
  if (preset === undefined || main.key !== WRIGHTSTONE_MAINS[family])
    return undefined;
  return { family, preset, subs: [sub1.key, sub2.key] };
}
