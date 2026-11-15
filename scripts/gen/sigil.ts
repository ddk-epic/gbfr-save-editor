import type { Context } from "./context";

export function genSigil({ db, emit }: Context) {
  // Gem rarity, traits and second-trait roll.
  const skillLots = new Map<string, string[]>();
  for (const { Key, SkillId } of db
    .prepare("select Key, SkillId from skill_lot")
    .all() as { Key: string; SkillId: string }[])
    skillLots.set(Key, [...(skillLots.get(Key) ?? []), SkillId]);
  const typeLots = new Map(
    (
      db.prepare("select * from skill_type_lot").all() as Record<
        string,
        string | number
      >[]
    ).map((row) => [
      row.Key as number,
      [1, 2, 3, 4, 5, 6].flatMap(
        (i) => skillLots.get(row[`SkillLotId${i}`] as string) ?? [],
      ),
    ]),
  );
  const gems = db
    .prepare(
      "select Key, SkillId1, SkillId2, SkillTypeLotIdForRandom2ndSkill as lot, Rarity, HideLevelNumber from gem where SkillId1 <> ''",
    )
    .all() as {
    Key: string;
    SkillId1: string;
    SkillId2: string;
    lot: number;
    Rarity: number;
    HideLevelNumber: number;
  }[];
  const gemRows = gems.map((gem) => {
    const traits = gem.SkillId2 ? [gem.SkillId1, gem.SkillId2] : [gem.SkillId1];
    const extra = [
      ...(!gem.SkillId2 && typeLots.has(gem.lot)
        ? [", rollsSecond: true"]
        : []),
      ...(gem.HideLevelNumber ? [", hideLevel: true"] : []),
    ].join("");
    return `  ${JSON.stringify(gem.Key)}: { rarity: ${gem.Rarity}, traits: ${JSON.stringify(traits)}${extra} },`;
  });
  const rarityLevels = (
    db
      .prepare(
        "select Key, DefaultLevel, MaxedLevel from gem_rare order by Key",
      )
      .all() as { Key: number; DefaultLevel: number; MaxedLevel: number }[]
  ).map((row) => `  ${row.Key}: [${row.DefaultLevel}, ${row.MaxedLevel}],`);
  const secondaries = [
    ...new Set(
      gems.flatMap((gem) => [
        gem.SkillId1,
        gem.SkillId2,
        ...(typeLots.get(gem.lot) ?? []),
      ]),
    ),
  ]
    .filter(Boolean)
    .sort();
  emit(
    "tables",
    `export interface Gem {
  /** gem.Rarity */
  rarity: number;
  /** skill.Key, SkillId1 then SkillId2. */
  traits: readonly string[];
  /** Rolls its second trait from a lot. */
  rollsSecond?: true;
  /** gem.HideLevelNumber */
  hideLevel?: true;
}

/** By gem.Key. */
export const GEM_ROWS: Readonly<Record<string, Gem>> = {
${gemRows.sort().join("\n")}
};`,
  );
  emit(
    "sigil",
    `/** gem_rare: DefaultLevel and MaxedLevel by rarity. */
export const SIGIL_RARITY_LEVELS: Readonly<
  Record<number, readonly [number, number]>
> = {
${rarityLevels.join("\n")}
};

/** Every skill a sigil can carry. */
export const SIGIL_SECONDARIES: readonly string[] = ${JSON.stringify(secondaries)};`,
  );
  console.log(
    `GEM_ROWS: ${gemRows.length} gems, SIGIL_SECONDARIES: ${secondaries.length} skills`,
  );
}
