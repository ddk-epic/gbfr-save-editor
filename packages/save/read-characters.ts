import type { UnitEntity, UnitStore } from "@gbfr/core";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_XP,
  CHARACTER_QUESTS_USED,
  CHARACTER_XP,
  characterEntities,
  masterLevelOf,
  readCaptain,
  type Captain,
} from "@gbfr/character";
import {
  EQUIP_CHARACTER,
  LOADOUT_COUNT,
  LOADOUT_FIRST,
  LOADOUT_NAME,
  equipmentLookup,
  readEquipment,
  type Equipment,
} from "@gbfr/equipment";
import { readFateEpisodes, type FateEpisode } from "@gbfr/fate-episode";
import {
  readMasteries,
  type MasteryProgress,
  type MasterySection,
} from "@gbfr/mastery";
import { readMasterTraits, type MasterTrait } from "@gbfr/master-trait";
import { readOverMasteries, type OverMastery } from "@gbfr/over-mastery";
import { readParty, readPartySets, type PartyMember } from "@gbfr/party";
import { sigilSlots } from "./sigil-slots";
import { readEquippedSkills } from "@gbfr/skill";
import { readEquippedSummons, type Summon } from "@gbfr/summon";
import { readOwnedWeapons, type Weapon } from "@gbfr/weapon";

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
  /** Open sigil slots. */
  sigilSlots: number;
  /** Owned weapons of the Collection series, by series. */
  weapons: Map<number, Weapon>;
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
  const ownedWeapons = readOwnedWeapons(units);

  const characters: Character[] = [];
  for (const where of characterEntities(units)) {
    const equipment = readEquipment(units, where.gear, CHARACTER_KEY, lookup);
    if (!equipment) continue;
    const at = units.of(where.gear);
    const masterXp = at.get(CHARACTER_MASTER_XP);
    const level = at.get(CHARACTER_LEVEL);
    const masteries = readMasteries(units, where.mastery, equipment.character);
    const episodes = fateEpisodes.get(equipment.character) ?? [];
    characters.push({
      ...equipment,
      entity: where.gear,
      skills: readEquippedSkills(units, where.gear),
      level,
      xp: at.get(CHARACTER_XP),
      baseHp: at.get(CHARACTER_BASE_HP),
      baseAttack: at.get(CHARACTER_BASE_ATTACK),
      questsUsed: at.get(CHARACTER_QUESTS_USED),
      masterXp,
      masterLevel: masterLevelOf(masterXp),
      overMasteries: readOverMasteries(units, where.mastery),
      masterTraits: readMasterTraits(units, where.mastery),
      masteries,
      fateEpisodes: episodes,
      sigilSlots: sigilSlots(equipment.character, level, episodes, masteries),
      weapons: ownedWeapons.get(equipment.character) ?? new Map(),
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

  return {
    captain: readCaptain(units),
    characters,
    party: readParty(units),
    partySets: readPartySets(units, lookup),
    summons: readEquippedSummons(units),
    loadouts,
  };
}
