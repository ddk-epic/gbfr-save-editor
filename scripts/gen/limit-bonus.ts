import type { Context } from "./context";

/** limit_bonus and limit_bonus_param, shared by the mastery, over mastery and conflux tables. */
export function loadLimitBonus({ db, load }: Context) {
  return load("limitBonus", () => {
    const bonusParams = new Map<string, string[]>();
    for (const row of db
      .prepare(`select Key, ParamId1, ParamId2, ParamId3 from limit_bonus`)
      .all() as Record<string, string>[]) {
      const params = [row.ParamId1, row.ParamId2, row.ParamId3].filter(
        (param): param is string => !!param,
      );
      const known = bonusParams.get(row.Key!);
      if (known && known.join() !== params.join())
        throw new Error(`limit_bonus ${row.Key} twice with other params`);
      bonusParams.set(row.Key!, params);
    }
    const paramValues = new Map<string, number[]>();
    for (const row of db
      .prepare(`select * from limit_bonus_param`)
      .all() as Record<string, number | string>[]) {
      // Stun Power (DisplayNumberMultiplier 3) is stored at a tenth of its display.
      const scale = row.DisplayNumberMultiplier === 3 ? 10 : 1;
      paramValues.set(
        row.Key as string,
        Array.from(
          { length: 10 },
          (_, i) =>
            Math.round((row[`Lv${i + 1}Value`] as number) * scale * 1000) /
            1000,
        ),
      );
    }
    return { bonusParams, paramValues };
  });
}
