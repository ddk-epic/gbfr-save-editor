import type { Context } from "./context";
import { loadMasterBadges } from "./badges";

export function genCharacter(ctx: Context) {
  const { db, emit } = ctx;
  // Menu order: playable 0-102, NPCs 500+, empty slots 1000+, dev rows 2000+.
  const uiOrder = (
    db.prepare("select CharId, UIOrder from chara").all() as {
      CharId: string;
      UIOrder: number;
    }[]
  ).map(({ CharId, UIOrder }) => `  ${CharId}: ${UIOrder},`);
  emit(
    "character",
    `/** chara.UIOrder by chara.CharId. */
export const CHARACTER_UI_ORDER: Readonly<Record<string, number>> = {
${uiOrder.sort().join("\n")}
};`,
  );

  // Row n is the MSP a character has spent on master levels at master level n.
  const masterMsp = (
    db.prepare("select TotalMSP from chara_master_exp").all() as {
      TotalMSP: number;
    }[]
  ).map((row) => row.TotalMSP);
  emit(
    "character",
    `/** chara_master_exp.TotalMSP, index = master level. */
export const MASTER_LEVEL_MSP: readonly number[] = [${masterMsp.join(", ")}];`,
  );
  console.log(`MASTER_LEVEL_MSP: ${masterMsp.length} levels`);

  const { masterBadges } = loadMasterBadges(ctx);
  emit(
    "character",
    `/** chara.CharId with master level badges. */
export const MASTER_LEVEL_CHARACTERS: readonly string[] = ${JSON.stringify([...masterBadges.keys()].sort())};`,
  );

  const maxStats = (
    db
      .prepare(
        `select c.CharId, s.Hp, s.Attack
       from chara c join chara_status s on s.Key = c.CharId and s.Level = c.MaxLevelMaybe
       where c.MaxLevelMaybe > 0`,
      )
      .all() as { CharId: string; Hp: number; Attack: number }[]
  ).map((r) => `  ${r.CharId}: { hp: ${r.Hp}, attack: ${r.Attack} },`);
  emit(
    "character",
    `/** chara_status Hp and Attack at level 100 by chara.CharId. */
export const CHARACTER_MAX_STATS: Readonly<
  Record<string, { hp: number; attack: number }>
> = {
${maxStats.sort().join("\n")}
};`,
  );
  console.log(`CHARACTER_MAX_STATS: ${maxStats.length} characters`);

  // ET_CI_Id: listed in the Crewmate menu.
  const unlockable = (
    db
      .prepare(
        "select CharId from chara where ET_CI_Id != '00000000' order by CharId",
      )
      .all() as { CharId: string }[]
  ).map((r) => `"${r.CharId}"`);
  emit(
    "character",
    `/** chara.CharId listed in the Crewmate menu. */
export const UNLOCKABLE_CHARACTERS: readonly string[] = [${unlockable.join(", ")}];`,
  );
  console.log(`UNLOCKABLE_CHARACTERS: ${unlockable.length}`);
}
