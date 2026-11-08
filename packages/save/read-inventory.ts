import { type UnitStore, SAVE_ENTITY } from "@gbfr/core";
import { readUnseenSkills } from "@gbfr/skill";
import { readCurios, type Curio } from "@gbfr/curio";
import { readItems, readItemsFlagged } from "@gbfr/item";
import { readSigils, type Sigil } from "@gbfr/sigil";
import { readSummons, type Summon } from "@gbfr/summon";
import { USER_MASTERY_POINTS, USER_RUPIES } from "@gbfr/user";
import { readWeapons, type Weapon } from "@gbfr/weapon";
import { readWrightstones, type InventoryWrightstone } from "@gbfr/wrightstone";

export interface Inventory {
  rupies: number;
  masteryPoints: number;
  /** Count by item.Key. Wrightstones are listed apart. */
  items: Map<string, number>;
  /** item.Key of the items on the wish list, in save order. */
  wishList: string[];
  /** item.Key of held items not yet seen, menu-hidden items included. */
  unseenItems: string[];
  /** ability.Key of acquired skills not yet seen, guest characters included. */
  unseenSkills: string[];
  /** Oldest first, the order the game appraises them in. */
  curios: Curio[];
  /** By wrightstone id. */
  wrightstones: Map<number, InventoryWrightstone>;
  /** By sigil id, the value equip positions reference. */
  sigils: Map<number, Sigil>;
  weapons: Map<number, Weapon>;
  /** By summon id, the value 1451 references. */
  summons: Map<number, Summon>;
}

export function readInventory(units: UnitStore): Inventory {
  const at = units.of(SAVE_ENTITY);
  return {
    rupies: at.get(USER_RUPIES),
    masteryPoints: at.get(USER_MASTERY_POINTS),
    items: readItems(units),
    wishList: readItemsFlagged(units, (flags) => flags.wishList),
    unseenItems: readItemsFlagged(
      units,
      (flags, count) => count > 0 && !flags.seen,
    ),
    unseenSkills: readUnseenSkills(units),
    curios: readCurios(units),
    wrightstones: readWrightstones(units),
    sigils: readSigils(units),
    weapons: readWeapons(units),
    summons: readSummons(units),
  };
}
