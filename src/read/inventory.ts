import type { UnitStore } from "../core/unit-store";
import { readUnseenSkills } from "../domains/skill/read";
import { readCurios, type Curio } from "../domains/curio/read";
import { readItems, readItemsFlagged } from "../domains/item/read";
import { readSigils, type Sigil } from "../domains/sigil/read";
import { readSummons, type Summon } from "../domains/summon/read";
import {
  SAVE_ENTITY,
  USER_MASTERY_POINTS,
  USER_RUPIES,
} from "../domains/user/attributes";
import { readWeapons, type Weapon } from "../domains/weapon/read";
import {
  readWrightstones,
  type InventoryWrightstone,
} from "../domains/wrightstone/read";

export interface Inventory {
  rupies: number;
  masteryPoints: number;
  /** Count by item.Key. Wrightstones are listed apart. */
  items: Map<string, number>;
  /** item.Key of the items on the wish list, in save order. */
  wishList: string[];
  /**
   * item.Key of held items not yet seen. Includes items the item menu does not
   * show, such as potions and wrightstone items.
   */
  unseenItems: string[];
  /**
   * ability.Key of skills in a character's list not yet seen, guest
   * characters included. Skills a character has not got hold 0 and are left out.
   */
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
