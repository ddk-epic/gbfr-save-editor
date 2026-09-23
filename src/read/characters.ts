import type { UnitEntity } from "../core/save-data-binary";
import type { UnitStore } from "../core/unit-store";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_XP,
  CHARACTER_QUESTS_USED,
  CHARACTER_XP,
} from "../domains/character/attributes";
import {
  CAPTAINS,
  characterEntities,
  masterLevelOf,
  type Captain,
} from "../domains/character/read";
import {
  EQUIP_CHARACTER,
  LOADOUT_COUNT,
  LOADOUT_FIRST,
  LOADOUT_NAME,
} from "../domains/equipment/attributes";
import {
  equipmentLookup,
  readEquipment,
  type Equipment,
} from "../domains/equipment/read";
import {
  readFateEpisodes,
  type FateEpisode,
} from "../domains/fate-episode/read";
import {
  readMasteries,
  type MasteryProgress,
  type MasterySection,
} from "../domains/mastery/read";
import {
  readMasterTraits,
  type MasterTrait,
} from "../domains/master-trait/read";
import {
  readOverMasteries,
  type OverMastery,
} from "../domains/over-mastery/read";
import {
  readParty,
  readPartySets,
  type PartyMember,
} from "../domains/party/read";
import { readEquippedSkills } from "../domains/skill/read";
import { readEquippedSummons, type Summon } from "../domains/summon/read";
import { SAVE_ENTITY, USER_CAPTAIN } from "../domains/user/attributes";

export interface Character extends Equipment {
  /** The character's own entity, which its live gear sits on. */
  entity: UnitEntity;
  /** ability.Key per skill position. */
  skills: (string | undefined)[];
  level: number;
  xp: number;
  /** HP and ATK from chara_status at this level, before gear and masteries. */
  baseHp: number;
  baseAttack: number;
  questsUsed: number;
  /** MSP spent on master levels. */
  masterXp: number;
  /** Highest master level masterXp pays for, from chara_master_exp. */
  masterLevel: number;
  /** 4 lines, undefined when not rolled. */
  overMasteries: (OverMastery | undefined)[];
  /** Selected master trait cells and active style perks, in save order. */
  masterTraits: MasterTrait[];
  /** Masteries by section, all zero for characters without ap_tree rows. */
  masteries: Record<MasterySection, MasteryProgress>;
  /** The character's fate episodes, in save order. */
  fateEpisodes: FateEpisode[];
}

export interface Loadout extends Equipment {
  name: string;
  /** ability.Key per skill position. */
  skills: (string | undefined)[];
}

export interface CharacterData {
  /** The captain picked at the start, undefined when 1103 holds neither. */
  captain: Captain | undefined;
  /** Every character's level and current equipment, in save order. */
  characters: Character[];
  /** Current party: chara.CharId per position. */
  party: (string | undefined)[];
  partySets: ((PartyMember | undefined)[] | undefined)[];
  /** Equipped summons, shared by the party. */
  summons: (Summon | undefined)[];
  /** Loadouts with a character assigned, in save order. */
  loadouts: Loadout[];
}

export function readCharacterData(units: UnitStore): CharacterData {
  const lookup = equipmentLookup(units);
  const fateEpisodes = readFateEpisodes(units);

  const characters: Character[] = [];
  for (const where of characterEntities(units)) {
    const equipment = readEquipment(units, where.gear, CHARACTER_KEY, lookup);
    if (!equipment) continue;
    const at = units.of(where.gear);
    const masterXp = at.get(CHARACTER_MASTER_XP);
    characters.push({
      ...equipment,
      entity: where.gear,
      skills: readEquippedSkills(units, where.gear),
      level: at.get(CHARACTER_LEVEL),
      xp: at.get(CHARACTER_XP),
      baseHp: at.get(CHARACTER_BASE_HP),
      baseAttack: at.get(CHARACTER_BASE_ATTACK),
      questsUsed: at.get(CHARACTER_QUESTS_USED),
      masterXp,
      masterLevel: masterLevelOf(masterXp),
      overMasteries: readOverMasteries(units, where.mastery),
      masterTraits: readMasterTraits(units, where.mastery),
      masteries: readMasteries(units, where.mastery, equipment.character),
      fateEpisodes: fateEpisodes.get(equipment.character) ?? [],
    });
  }

  const loadouts: Loadout[] = [];
  for (let i = 0; i < LOADOUT_COUNT; i++) {
    const entity = LOADOUT_FIRST + i;
    const equipment = readEquipment(units, entity, EQUIP_CHARACTER, lookup);
    if (equipment)
      loadouts.push({
        ...equipment,
        name: units.of(entity).get(LOADOUT_NAME),
        skills: readEquippedSkills(units, entity),
      });
  }

  const captainNumber = units.of(SAVE_ENTITY).get(USER_CAPTAIN);
  const captain =
    captainNumber === undefined ? undefined : CAPTAINS[captainNumber - 1];

  return {
    captain,
    characters,
    party: readParty(units),
    partySets: readPartySets(units, lookup),
    summons: readEquippedSummons(units),
    loadouts,
  };
}
