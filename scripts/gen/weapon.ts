import type { Context } from "./context";

export function genWeapon({ db, emit }: Context) {
  // Weapon rows by key, forged on the one row an unlock adds per series.
  const NEVER_FORGED_QUEST = "00999999";
  const weaponRows = db
    .prepare(
      `select Key, Unk30 as series, CharaId, unk52 as obtainable, MinFeatureVersion as unlockVersion,
       WeaponId2 as base, ForgeUnlockQuestId as quest, ForgedUncapLevel as uncap, ForgedWeaponLevel as level
     from weapon where Key <> '' order by Key`,
    )
    .all() as {
    Key: string;
    series: number;
    CharaId: string;
    obtainable: number;
    unlockVersion: number;
    base: string;
    quest: string;
    uncap: number;
    level: number;
  }[];
  const unlockRows = new Map<string, (typeof weaponRows)[number]>();
  for (const row of weaponRows) {
    if (!row.obtainable || row.series === 7) continue;
    if (row.base && row.base !== row.Key) continue;
    const slot = `${row.CharaId}:${row.series}`;
    if (!unlockRows.has(slot) || row.quest !== NEVER_FORGED_QUEST)
      unlockRows.set(slot, row);
  }
  const unlockKeys = new Set([...unlockRows.values()].map(({ Key }) => Key));
  emit(
    "weapon",
    `export interface WeaponRow {
  /** weapon.Unk30 */
  series: number;
  /** weapon.CharaId */
  character: string;
  /** weapon.unk52 */
  obtainable?: true;
  /** weapon.MinFeatureVersion */
  unlockVersion?: number;
  /** weapon.ForgedUncapLevel and ForgedWeaponLevel */
  forged?: readonly [uncap: number, level: number];
}

/** By weapon.Key, ${weaponRows.length} weapons. */
export const WEAPON_ROWS: Readonly<Record<string, WeaponRow>> = {
${weaponRows
  .map(
    ({ Key, series, CharaId, obtainable, unlockVersion, uncap, level }) =>
      `  ${JSON.stringify(Key)}: { series: ${series}, character: ${JSON.stringify(CharaId)}${obtainable ? ", obtainable: true" : ""}${unlockVersion ? `, unlockVersion: ${unlockVersion}` : ""}${unlockKeys.has(Key) ? `, forged: [${uncap}, ${level}]` : ""} },`,
  )
  .join("\n")}
};`,
  );
  console.log(
    `WEAPON_ROWS: ${weaponRows.length} weapons, ${unlockKeys.size} unlocks`,
  );

  // XP of each level, weapon_exp in row order: the first row is level 1.
  const weaponLevelXp = (
    db.prepare("select Exp from weapon_exp").all() as { Exp: number }[]
  ).map(({ Exp }) => Exp);
  emit(
    "weapon",
    `/** weapon_exp.Exp by level - 1. */
export const WEAPON_LEVEL_XP: readonly number[] = [${weaponLevelXp.join(", ")}];`,
  );
  console.log(`WEAPON_LEVEL_XP: ${weaponLevelXp.length} levels`);
}
