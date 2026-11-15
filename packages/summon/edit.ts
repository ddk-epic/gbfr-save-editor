import type { Draft } from "@gbfr/core/draft";
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
export function giveSummon(draft: Draft, summon: GivenSummon): boolean {
  const hash = hashId(summon.key);
  if (draft.entitiesWhere(SUMMON_KEY, hash).length > 0) return false;

  let entity = SUMMON_FIRST;
  while (draft.of(entity).get(SUMMON_ID) !== 0) {
    entity++;
    if (entity >= SUMMON_FIRST + SUMMON_LIST_ENTRIES)
      throw new Error("no free summon entry");
  }
  const at = draft.of(SAVE_ENTITY);
  const id = at.get(SUMMON_LAST_ID) + 1;
  const held = draft.of(entity);
  held.set(SUMMON_ID, id);
  held.set(SUMMON_KEY, `#${hash.toString(16).padStart(8, "0")}`);
  held.set(SUMMON_TRAIT_AND_BONUS, [hashId(summon.trait), summon.bonus]);
  held.set(SUMMON_LEVELS, [...summon.levels]);
  held.replace(SUMMON_FLAGS, {});
  at.set(SUMMON_LAST_ID, id);
  at.set(SUMMONS_UNLOCKED, 1);
  const row = draft.entitiesWhere(SUMMONS_KEY, hash)[0];
  if (row !== undefined) draft.of(row).set(SUMMONS_OBTAINED, 1);
  if (summon.equip) {
    const equipped = [...at.get(SUMMONS_EQUIPPED)];
    const slot = equipped.indexOf(0);
    if (slot !== -1) {
      equipped[slot] = id;
      at.set(SUMMONS_EQUIPPED, equipped);
    }
  }
  return true;
}
