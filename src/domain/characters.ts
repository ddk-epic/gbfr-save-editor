import {
  CHARACTER_KEYS,
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
  LIMIT_BONUS_PARAM_KEYS,
  MASTERY_BONUSES,
  MASTERY_NODES,
  MASTERY_PARAM_VALUES,
  MASTERY_SECTIONS,
  REPLACED_TRANSCENDENCE,
} from "../data/masteries";
import { ABILITY_KEYS } from "../data/skills";
import { SaveFormatError } from "../errors";
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
  ID,
  OVER_MASTERY_LINES,
  SIGIL_SLOTS,
  SKILL_SLOTS,
  SUMMON_SLOTS,
  UNIT,
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

/** Equipment on a unit whose character key is stored under `characterAttribute`. */
function readEquipment(
  units: UnitStore,
  inventory: Inventory,
  entity: number,
  characterAttribute: number,
): Equipment | undefined {
  const character = keyOf(
    CHARACTER_KEYS,
    units.values(characterAttribute, entity, "uint")?.[0],
  );
  if (character === undefined) return undefined;

  const weaponSlot = units.values(ID.EQUIP_WEAPON, entity, "uint")?.[0];
  const sigilSlots = units.values(ID.EQUIP_SIGILS, entity, "uint") ?? [];
  const skills = units.values(ID.EQUIP_SKILLS, entity, "uint") ?? [];

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

const MASTER_TRAIT_STYLES = ["SB_DEF", "SB_ATK", "SB_LIMIT"];
const MASTER_TRAIT_RANKS = ["r1", "r2", "r3", "ex"];

/** Every board cell, by style, rank, perks first, then board order. */
function readMasterTraits(
  units: UnitStore,
  characterEntity: number,
): MasterTrait[] {
  const base = progressBase(characterEntity);
  const cells: MasterTrait[] = [];
  for (let i = 0; i < UNIT.CHARACTER_PROGRESS_ENTRIES; i++) {
    const hash = units.values(ID.PROGRESS_KEY, base + i, "uint")?.[0];
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
      chosen: units.values(ID.PROGRESS_VALUE, base + i, "int")?.[0] === 1,
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

  const base = progressBase(characterEntity);
  const takenBits = new Map<number, number>();
  for (let i = 0; i < UNIT.CHARACTER_PROGRESS_ENTRIES; i++) {
    const hash = units.values(ID.PROGRESS_KEY, base + i, "uint")?.[0];
    const ladder = hash === undefined ? undefined : nodes[hash];
    if (!ladder) continue;
    // Low byte: bit n is the node at LimitBonusParamIndex n. The second byte
    // flags a subset of those and has no meaning assigned.
    const bits =
      (units.values(ID.PROGRESS_VALUE, base + i, "int")?.[0] ?? 0) & 0xff;
    ladder.forEach((node, index) => {
      if (bits & (1 << index) && !node)
        throw new SaveFormatError({
          code: "unusedMasteryBit",
          entity: base + i,
          bit: index,
        });
    });
    takenBits.set(hash!, bits);
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
    const key = keyOf(
      LIMIT_BONUS_PARAM_KEYS,
      units.values(ID.CHARACTER_OVER_MASTERY_KEY, base + i, "uint")?.[0],
    );
    if (key === undefined) return undefined;
    // The level is stored as one bit: level n is 1 << (n - 1).
    const bits =
      units.values(ID.CHARACTER_OVER_MASTERY_LEVEL, base + i, "int")?.[0] ?? 0;
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

/** 3502 state bit set once an episode is completed. */
const FATE_EPISODE_COMPLETED = 8;

function readFateEpisodes(units: UnitStore): Map<string, FateEpisode[]> {
  const byCharacter = new Map<string, FateEpisode[]>();
  for (const unit of units.withAttribute(ID.FATE_EPISODE_KEY)) {
    const hash = (unit.values as number[])[0];
    const key = keyOf(FATE_EPISODE_KEYS, hash);
    if (key === undefined) continue;
    // Untitled episodes, REMI_*, are not in the menu.
    const character = FATE_EPISODE_CHARACTERS[hash!];
    if (character === undefined) continue;
    const state =
      units.values(ID.FATE_EPISODE_STATE, unit.entity, "uint")?.[0] ?? 0;
    const episodes = byCharacter.get(character) ?? [];
    episodes.push({ key, completed: (state & FATE_EPISODE_COMPLETED) !== 0 });
    byCharacter.set(character, episodes);
  }
  return byCharacter;
}

function readName(units: UnitStore, entity: number): string {
  const bytes = units.values(ID.LOADOUT_NAME, entity, "byte") ?? [];
  const end = bytes.indexOf(0);
  return String.fromCharCode(...(end === -1 ? bytes : bytes.slice(0, end)));
}

export function readCharacterData(units: UnitStore): CharacterData {
  const inventory = readInventory(units);

  const fateEpisodes = readFateEpisodes(units);

  const characters: Character[] = [];
  for (const { entity } of units.withAttribute(ID.CHARACTER_KEY)) {
    const equipment = readEquipment(units, inventory, entity, ID.CHARACTER_KEY);
    if (!equipment) continue;
    const int = (attribute: number) =>
      units.values(attribute, entity, "int")?.[0] ?? 0;
    characters.push({
      ...equipment,
      level: int(ID.CHARACTER_LEVEL),
      xp: int(ID.CHARACTER_XP),
      baseHp: int(ID.CHARACTER_BASE_HP),
      baseAttack: int(ID.CHARACTER_BASE_ATTACK),
      questsUsed:
        units.values(ID.CHARACTER_QUESTS_USED, entity, "uint")?.[0] ?? 0,
      masterXp: int(ID.CHARACTER_MASTER_XP),
      masterLevel: masterLevelOf(int(ID.CHARACTER_MASTER_XP)),
      overMasteries: readOverMasteries(units, entity),
      masterTraits: readMasterTraits(units, entity),
      masteries: readMasteries(units, entity, equipment.character),
      fateEpisodes: fateEpisodes.get(equipment.character) ?? [],
    });
  }

  const party = Array.from({ length: UNIT.PARTY_SIZE }, (_, i) =>
    keyOf(
      CHARACTER_KEYS,
      units.values(ID.PARTY_CHARACTER, UNIT.PARTY + i, "uint")?.[0],
    ),
  );

  const equippedSummons =
    units.values(ID.SUMMONS_EQUIPPED, UNIT.SUMMON, "uint") ?? [];
  const summons = Array.from({ length: SUMMON_SLOTS }, (_, i) => {
    const id = equippedSummons[i];
    return id ? inventory.summons.get(id) : undefined;
  });

  const loadouts: Loadout[] = [];
  for (let i = 0; i < UNIT.LOADOUT_COUNT; i++) {
    const entity = UNIT.LOADOUT + i;
    const equipment = readEquipment(
      units,
      inventory,
      entity,
      ID.EQUIP_CHARACTER,
    );
    if (equipment)
      loadouts.push({ ...equipment, name: readName(units, entity) });
  }

  const captainNumber = units.values(ID.USER_CAPTAIN, 0, "int")?.[0];
  const captain =
    captainNumber === undefined ? undefined : CAPTAINS[captainNumber - 1];

  return { captain, characters, party, summons, loadouts };
}
