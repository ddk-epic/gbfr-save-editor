import {
  CHARACTER_UI_ORDER,
  FATE_EPISODE_CHARACTERS,
  FATE_EPISODE_KEYS,
  MASTER_LEVEL_MSP,
} from "../data/characters";
import {
  MASTER_TRAIT_VALUES,
  MASTER_TRAIT_VALUE_SCALES,
  SKILLBOARD_CELLS,
  SKILLBOARD_EFFECT_KEYS,
} from "../data/master-traits";
import {
  MASTERY_BONUSES,
  MASTERY_NODES,
  MASTERY_PARAM_VALUES,
  MASTERY_SECTIONS,
  REPLACED_TRANSCENDENCE,
} from "../data/masteries";
import { ABILITY_KEYS } from "../data/skills";
import { SaveFormatError } from "../errors";
import type { Attribute } from "../format/attribute";
import type { UnitStore } from "../format/unit-store";
import {
  readInventory,
  type Inventory,
  type Sigil,
  type Summon,
  type Weapon,
} from "./inventory";
import { keyOf } from "./keys";
import {
  CHARACTER_BASE_ATTACK,
  CHARACTER_BASE_HP,
  CHARACTER_KEY,
  CHARACTER_LEVEL,
  CHARACTER_MASTER_XP,
  CHARACTER_OVER_MASTERY_KEY,
  CHARACTER_OVER_MASTERY_LEVEL,
  CHARACTER_QUESTS_USED,
  CHARACTER_XP,
  EQUIP_CHARACTER,
  EQUIP_SIGILS,
  EQUIP_SKILLS,
  EQUIP_WEAPON,
  FATE_EPISODE_KEY,
  FATE_EPISODE_STATE,
  LOADOUT_NAME,
  OVER_MASTERY_LINES,
  PARTY_CHARACTER,
  PROGRESS_KEY,
  PROGRESS_VALUE,
  SAVE_WIDE,
  SIGIL_SLOTS,
  SKILL_SLOTS,
  SUMMONS_EQUIPPED,
  SUMMON_SLOTS,
  UNIT,
  USER_CAPTAIN,
} from "./layout";

/** NP rows: Lyria, Vyrn, Sierokarte, Rolan, Historiath, Zathba. */
export const isNPC = (character: string) => /^NP\d{4}$/.test(character);

/** Rows no save should use: empty party slots, the LookDev rig, Id's second form. */
export const isUnused = (character: string) =>
  /^SLOT\d{2}$/.test(character) ||
  character === "PL000B" ||
  character === "PL2000";

/** Gran and Djeeta, in the order 1103 numbers them from 1. */
export const CAPTAINS = ["PL0000", "PL0100"] as const;
export type Captain = (typeof CAPTAINS)[number];

/** The captain the save did not pick. Unknown when the save names no captain. */
export const isUnchosenCaptain = (
  character: string,
  captain: Captain | undefined,
) =>
  captain !== undefined &&
  (CAPTAINS as readonly string[]).includes(character) &&
  character !== captain;

/** chara.UIOrder: playable, then NPCs, empty slots and dev rows; unresolved keys last. */
export const characterOrder = (character: string) =>
  CHARACTER_UI_ORDER[character] ?? Infinity;

export interface Equipment {
  /** chara.CharId */
  character: string;
  weapon: Weapon | undefined;
  /** 12 slots, undefined when empty. */
  sigils: (Sigil | undefined)[];
  /** ability.Key per skill slot, undefined when empty. */
  skills: (string | undefined)[];
}

export interface OverMastery {
  /** limit_bonus_param.Key, MED_EFF_* */
  key: string;
  /** Roll level 1-10. */
  level: number;
}

export interface MasterTrait {
  /** skillboard_effect.Key */
  key: string;
  /** skillboard_category: SB_DEF Insight, SB_ATK Essence, SB_LIMIT Crux. */
  style: string;
  rank: "r1" | "r2" | "r3" | "ex";
  /** skillboard_layout Unk30, the cell's place on the board. */
  order: number;
  /** A style perk: named at r1, upgraded at r2 and r3. */
  perk: boolean;
  chosen: boolean;
  /** Numbers for {0}-{29} in the trait's text, as the archive stores them. */
  values: readonly number[];
  /** What each value is multiplied by to display it, 1 past the list. */
  valueScales: readonly number[];
}

export type MasterySection = (typeof MASTERY_SECTIONS)[number];

export interface MasteryNode {
  /** limit_bonus.Key */
  key: string;
  /** ap_tree NodeGridLocation. */
  grid: number;
  msp: number;
  taken: boolean;
  /** limit_bonus_param effects of the node, each with its value as displayed. */
  params: MasteryEffect[];
}

export interface MasteryEffect {
  /** limit_bonus_param.Key */
  key: string;
  /** Lv{n}Value at LimitBonusParamIndex n - 1; the T1-6 value (Lv9Value) on T7 transcendence. */
  value: number;
  /** T7 transcendence bonus over the T1-6 value (Lv10Value), shown as <d>+{1}<d>. */
  bonus?: number;
}

export interface MasteryProgress {
  /** Nodes taken. */
  taken: number;
  /** Nodes in the section; transcendence counts the T7 rows only. */
  total: number;
  /** MspCost of the nodes taken. */
  msp: number;
  /** The section's nodes by grid location; T1-6 transcendence rows only when taken. */
  nodes: MasteryNode[];
}

export interface FateEpisode {
  /** fate_episode.Key */
  key: string;
  completed: boolean;
}

export interface Character extends Equipment {
  level: number;
  xp: number;
  /** HP and ATK from chara_status at this level, before gear and masteries. */
  baseHp: number;
  baseAttack: number;
  /** Times the character was used in a quest. */
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
}

export interface CharacterData {
  /** The captain picked at the start, undefined when 1103 holds neither. */
  captain: Captain | undefined;
  /** Every character's level and current equipment, in save order. */
  characters: Character[];
  /** Current party: chara.CharId per slot, undefined when empty. */
  party: (string | undefined)[];
  /** Equipped summons, shared by the party, undefined when empty. */
  summons: (Summon | undefined)[];
  /** Loadouts with a character assigned, in save order. */
  loadouts: Loadout[];
}

/** Equipment on an entity whose character key is stored under `characterKey`. */
function readEquipment(
  units: UnitStore,
  inventory: Inventory,
  entity: number,
  characterKey: Attribute<string | undefined>,
): Equipment | undefined {
  const at = units.of(entity);
  const character = at.get(characterKey);
  if (character === undefined) return undefined;

  const weaponSlot = at.get(EQUIP_WEAPON);
  const sigilSlots = at.get(EQUIP_SIGILS);
  const skills = at.get(EQUIP_SKILLS);

  return {
    character,
    weapon: weaponSlot ? inventory.weapons.get(weaponSlot) : undefined,
    sigils: Array.from({ length: SIGIL_SLOTS }, (_, i) => {
      const slot = sigilSlots[i];
      return slot ? inventory.sigils.get(slot) : undefined;
    }),
    skills: Array.from({ length: SKILL_SLOTS }, (_, i) =>
      keyOf(ABILITY_KEYS, skills[i]),
    ),
  };
}

const progressBase = (characterEntity: number) =>
  UNIT.CHARACTER_PROGRESS + (characterEntity - UNIT.CHARACTER) * 1000;

/** The entities holding one character's masteries and master traits. */
const progressRange = (characterEntity: number) => ({
  first: progressBase(characterEntity),
  count: UNIT.CHARACTER_PROGRESS_ENTRIES,
});

const MASTER_TRAIT_STYLES = ["SB_DEF", "SB_ATK", "SB_LIMIT"];
const MASTER_TRAIT_RANKS = ["r1", "r2", "r3", "ex"];

/** Every board cell, by style, rank, perks first, then board order. */
function readMasterTraits(
  units: UnitStore,
  characterEntity: number,
): MasterTrait[] {
  const cells: MasterTrait[] = [];
  for (const entity of units.entitiesWith(
    PROGRESS_KEY,
    progressRange(characterEntity),
  )) {
    const at = units.of(entity);
    const hash = at.get(PROGRESS_KEY);
    const cell = hash === undefined ? undefined : SKILLBOARD_CELLS[hash];
    if (cell === undefined) continue;
    const [style, rank, order, perk] = cell;
    const key = keyOf(SKILLBOARD_EFFECT_KEYS, hash)!;
    cells.push({
      key,
      style,
      rank,
      order,
      perk,
      chosen: at.get(PROGRESS_VALUE) === 1,
      values: MASTER_TRAIT_VALUES[key] ?? [],
      valueScales: MASTER_TRAIT_VALUE_SCALES[key] ?? [],
    });
  }
  const sortKey = (c: MasterTrait) => [
    MASTER_TRAIT_STYLES.indexOf(c.style),
    MASTER_TRAIT_RANKS.indexOf(c.rank),
    c.perk ? 0 : 1,
    c.order,
  ];
  return cells.sort((a, b) => {
    const [ka, kb] = [sortKey(a), sortKey(b)];
    const i = ka.findIndex((n, j) => n !== kb[j]);
    return i === -1 ? 0 : ka[i]! - kb[i]!;
  });
}

function readMasteries(
  units: UnitStore,
  characterEntity: number,
  character: string,
): Record<MasterySection, MasteryProgress> {
  const progress = Object.fromEntries(
    MASTERY_SECTIONS.map((section): [MasterySection, MasteryProgress] => [
      section,
      { taken: 0, total: 0, msp: 0, nodes: [] },
    ]),
  ) as Record<MasterySection, MasteryProgress>;
  const nodes = MASTERY_NODES[character];
  if (!nodes) return progress;

  const takenBits = new Map<number, number>();
  for (const entity of units.entitiesWith(
    PROGRESS_KEY,
    progressRange(characterEntity),
  )) {
    const at = units.of(entity);
    const hash = at.get(PROGRESS_KEY);
    if (hash === undefined) continue;
    const ladder = nodes[hash];
    if (!ladder) continue;
    // Low byte: bit n is the node at LimitBonusParamIndex n. The second byte
    // flags a subset of those and has no meaning assigned.
    const bits = at.get(PROGRESS_VALUE) & 0xff;
    ladder.forEach((node, index) => {
      if (bits & (1 << index) && !node)
        throw new SaveFormatError({
          code: "unusedMasteryBit",
          entity,
          bit: index,
        });
    });
    takenBits.set(hash, bits);
  }

  for (const [hash, ladder] of Object.entries(nodes)) {
    const [key, ...params] = MASTERY_BONUSES[Number(hash)]!;
    const bits = takenBits.get(Number(hash)) ?? 0;
    ladder.forEach((node, index) => {
      if (!node) return;
      const [section, msp, grid] = node;
      const taken = !!(bits & (1 << index));
      const replaced = section === REPLACED_TRANSCENDENCE;
      if (replaced && !taken) return;
      const sectionProgress =
        progress[
          MASTERY_SECTIONS[
            replaced ? MASTERY_SECTIONS.indexOf("transcendence") : section
          ]!
        ];
      if (!replaced) sectionProgress.total++;
      if (taken) {
        sectionProgress.taken++;
        sectionProgress.msp += msp;
      }
      sectionProgress.nodes.push({
        key: key!,
        grid,
        msp,
        taken,
        params: params.map((param): MasteryEffect => {
          const values = MASTERY_PARAM_VALUES[param]!;
          return section === MASTERY_SECTIONS.indexOf("transcendence")
            ? { key: param, value: values[8]!, bonus: values[9]! }
            : { key: param, value: values[index]! };
        }),
      });
    });
  }
  for (const sectionProgress of Object.values(progress))
    sectionProgress.nodes.sort((a, b) => a.grid - b.grid);
  return progress;
}

function readOverMasteries(
  units: UnitStore,
  characterEntity: number,
): (OverMastery | undefined)[] {
  const base = progressBase(characterEntity);
  return Array.from({ length: OVER_MASTERY_LINES }, (_, i) => {
    const at = units.of(base + i);
    const key = at.get(CHARACTER_OVER_MASTERY_KEY);
    if (key === undefined) return undefined;
    // The level is stored as one bit: level n is 1 << (n - 1).
    const bits = at.get(CHARACTER_OVER_MASTERY_LEVEL);
    const level = Math.log2(bits) + 1;
    if (!Number.isInteger(level))
      throw new SaveFormatError({
        code: "overMasteryLevel",
        entity: base + i,
        bits,
      });
    return { key, level };
  });
}

function masterLevelOf(xp: number): number {
  let level = 0;
  while (
    level + 1 < MASTER_LEVEL_MSP.length &&
    MASTER_LEVEL_MSP[level + 1]! <= xp
  )
    level++;
  return level;
}

function readFateEpisodes(units: UnitStore): Map<string, FateEpisode[]> {
  const byCharacter = new Map<string, FateEpisode[]>();
  for (const entity of units.entitiesWith(FATE_EPISODE_KEY)) {
    const at = units.of(entity);
    const hash = at.get(FATE_EPISODE_KEY);
    if (hash === undefined) continue;
    const key = keyOf(FATE_EPISODE_KEYS, hash);
    if (key === undefined) continue;
    // Untitled episodes, REMI_*, are not in the menu.
    const character = FATE_EPISODE_CHARACTERS[hash];
    if (character === undefined) continue;
    const episodes = byCharacter.get(character) ?? [];
    episodes.push({ key, completed: at.get(FATE_EPISODE_STATE).completed });
    byCharacter.set(character, episodes);
  }
  return byCharacter;
}

export function readCharacterData(units: UnitStore): CharacterData {
  const inventory = readInventory(units);

  const fateEpisodes = readFateEpisodes(units);

  const characters: Character[] = [];
  for (const entity of units.entitiesWith(CHARACTER_KEY)) {
    const equipment = readEquipment(units, inventory, entity, CHARACTER_KEY);
    if (!equipment) continue;
    const at = units.of(entity);
    const masterXp = at.get(CHARACTER_MASTER_XP);
    characters.push({
      ...equipment,
      level: at.get(CHARACTER_LEVEL),
      xp: at.get(CHARACTER_XP),
      baseHp: at.get(CHARACTER_BASE_HP),
      baseAttack: at.get(CHARACTER_BASE_ATTACK),
      questsUsed: at.get(CHARACTER_QUESTS_USED),
      masterXp,
      masterLevel: masterLevelOf(masterXp),
      overMasteries: readOverMasteries(units, entity),
      masterTraits: readMasterTraits(units, entity),
      masteries: readMasteries(units, entity, equipment.character),
      fateEpisodes: fateEpisodes.get(equipment.character) ?? [],
    });
  }

  const party = Array.from({ length: UNIT.PARTY_SIZE }, (_, i) =>
    units.of(UNIT.PARTY + i).get(PARTY_CHARACTER),
  );

  const equippedSummons = units.of(UNIT.SUMMON).get(SUMMONS_EQUIPPED);
  const summons = Array.from({ length: SUMMON_SLOTS }, (_, i) => {
    const id = equippedSummons[i];
    return id ? inventory.summons.get(id) : undefined;
  });

  const loadouts: Loadout[] = [];
  for (let i = 0; i < UNIT.LOADOUT_COUNT; i++) {
    const entity = UNIT.LOADOUT + i;
    const equipment = readEquipment(units, inventory, entity, EQUIP_CHARACTER);
    if (equipment)
      loadouts.push({
        ...equipment,
        name: units.of(entity).get(LOADOUT_NAME),
      });
  }

  const captainNumber = units.of(SAVE_WIDE).get(USER_CAPTAIN);
  const captain =
    captainNumber === undefined ? undefined : CAPTAINS[captainNumber - 1];

  return { captain, characters, party, summons, loadouts };
}
