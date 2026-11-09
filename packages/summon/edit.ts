import type { Patch, SaveSession } from "@gbfr/core/session";
import { hashId, SAVE_ENTITY } from "@gbfr/core";
import {
  SUMMON_FIRST,
  SUMMON_FLAGS,
  SUMMON_ID,
  SUMMON_KEY,
  SUMMON_LAST_ID,
  SUMMON_LEVELS,
  SUMMON_LIST_ENTRIES,
  SUMMON_TRAIT_AND_BONUS,
  SUMMONS_EQUIPPED,
  SUMMONS_KEY,
  SUMMONS_OBTAINED,
  SUMMONS_UNLOCKED,
} from "./attributes";
import type { GivenSummon } from "./read";

/** Adds a summon the save does not hold, and returns whether it did. */
export function giveSummon(session: SaveSession, summon: GivenSummon): boolean {
  const units = session.save.slotData.units;
  const hash = hashId(summon.key);
  if (units.entitiesWhere(SUMMON_KEY, hash).length > 0) return false;

  let entity = SUMMON_FIRST;
  while (units.of(entity).get(SUMMON_ID) !== 0) {
    entity++;
    if (entity >= SUMMON_FIRST + SUMMON_LIST_ENTRIES)
      throw new Error("no free summon entry");
  }
  const at = units.of(SAVE_ENTITY);
  const id = at.get(SUMMON_LAST_ID) + 1;
  const held = units.of(entity);
  const patches: Patch[] = [
    held.patch(SUMMON_ID, id),
    held.patch(SUMMON_KEY, `#${hash.toString(16).padStart(8, "0")}`),
    held.patch(SUMMON_TRAIT_AND_BONUS, [hashId(summon.trait), summon.bonus]),
    held.patch(SUMMON_LEVELS, [...summon.levels]),
    held.replace(SUMMON_FLAGS, {}),
    at.patch(SUMMON_LAST_ID, id),
    at.patch(SUMMONS_UNLOCKED, 1),
  ];
  const row = units.entitiesWhere(SUMMONS_KEY, hash)[0];
  if (row !== undefined) patches.push(units.of(row).patch(SUMMONS_OBTAINED, 1));
  if (summon.equip) {
    const equipped = [...at.get(SUMMONS_EQUIPPED)];
    const slot = equipped.indexOf(0);
    if (slot !== -1) {
      equipped[slot] = id;
      patches.push(at.patch(SUMMONS_EQUIPPED, equipped));
    }
  }
  session.patch(patches);
  return true;
}
