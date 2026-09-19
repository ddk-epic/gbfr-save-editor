import type { UnitEntity } from "../../core/save-data-binary";
import type { UnitStore } from "../../core/unit-store";
import { questId } from "../quest/read";
import {
  CARD_CHARACTER_KEY,
  CARD_CHARACTER_LEVEL,
  CARD_CHARACTER_MASTER_LEVEL,
  CARD_CHARACTER_MOST_USED,
  CARD_CHARACTER_LAST_PLAYED,
  CARD_CHARACTER_QUESTS_USED,
  CARD_CHARACTER_STRIDE,
  PLAYER_GRADE,
  PLAYER_ID,
  PLAYER_LAST_SEEN,
  PLAYER_NAME,
  PLAYER_QUEST,
  PROFILE_FIRST,
  PROFILE_QUESTS_CLEARED,
  RECENT_PLAYER_COUNT,
  RECENT_PLAYER_FIRST,
} from "./attributes";

export interface CardCharacter {
  entity: UnitEntity;
  /** chara.CharId */
  character: string;
  level: number;
  /** Times used in a quest. */
  questsUsed: number;
  /** As stored; the game shows at most 50. */
  masterLevel: number;
}

interface CardCharacters {
  /** The character last played. */
  lastPlayed: CardCharacter | undefined;
  /** The three most used characters. */
  mostUsed: (CardCharacter | undefined)[];
}

/** The player's own profile, in the same format as the online player list entry. */
export interface Profile extends CardCharacters {
  questsCleared: number;
}

/** Another player's card from the recent player list. */
export interface RecentPlayer extends CardCharacters {
  entity: UnitEntity;
  name: string;
  /** 16 hex digits. */
  playerId: string;
  lastSeen: Date;
  /** The quest played together, a quest id. */
  quest: string;
  /** Skyfarer grade 1-4. */
  grade: number;
  questsCleared: number;
}

function readCardCharacter(
  units: UnitStore,
  entity: UnitEntity,
): CardCharacter | undefined {
  const at = units.of(entity);
  const character = at.get(CARD_CHARACTER_KEY);
  if (character === undefined) return undefined;
  return {
    entity,
    character,
    level: at.get(CARD_CHARACTER_LEVEL),
    questsUsed: at.get(CARD_CHARACTER_QUESTS_USED),
    masterLevel: at.get(CARD_CHARACTER_MASTER_LEVEL),
  };
}

function readCardCharacters(
  units: UnitStore,
  card: UnitEntity,
): CardCharacters {
  const first = card * CARD_CHARACTER_STRIDE;
  return {
    lastPlayed: readCardCharacter(units, first + CARD_CHARACTER_LAST_PLAYED),
    mostUsed: CARD_CHARACTER_MOST_USED.map((i) =>
      readCardCharacter(units, first + i),
    ),
  };
}

export function readProfile(units: UnitStore): Profile {
  return {
    questsCleared: units.of(PROFILE_FIRST).get(PROFILE_QUESTS_CLEARED),
    ...readCardCharacters(units, PROFILE_FIRST),
  };
}

/** Newest first. A card with no player ID is empty and left out. */
export function readRecentPlayers(units: UnitStore): RecentPlayer[] {
  const players: RecentPlayer[] = [];
  for (let i = 0; i < RECENT_PLAYER_COUNT; i++) {
    const entity = RECENT_PLAYER_FIRST + i;
    const at = units.of(entity);
    const playerId = at.get(PLAYER_ID);
    if (!playerId) continue;
    players.push({
      entity,
      name: at.get(PLAYER_NAME),
      playerId,
      lastSeen: new Date(Number(at.get(PLAYER_LAST_SEEN))),
      quest: questId(at.get(PLAYER_QUEST)),
      grade: at.get(PLAYER_GRADE),
      questsCleared: at.get(PROFILE_QUESTS_CLEARED),
      ...readCardCharacters(units, entity),
    });
  }
  return players;
}
