import type { UnitStore } from "../core/unit-store";
import {
  LOCATION_PARTY_HP,
  LOCATION_SPOT,
  LOCATION_STAGE,
  SAVE_FEATURE_VERSION,
  SAVE_SLOT_VERSION,
  SAVE_WIDE,
  SYSTEM_PLAY_TIME,
  USER_COMMENDATIONS,
  USER_ONLINE_STATUS_FLAGS,
  USER_PLAYER_NAME,
} from "./layout";

/** The save-wide SlotData values, 1001-1207. */
export interface User {
  slotVersion: number | undefined;
  featureVersion: number | undefined;
  playerName: string;
  commendations: number;
  /** Bits not known. */
  onlineStatusFlags: number;
  /** `stagename.PhaseId`, 8 hex digits, undefined when the save holds none. */
  stage: string | undefined;
  spot: string;
  /** HP of the player's party slot, the only one holding a value. */
  partyHp: number;
}

/** The SystemData values. */
export interface System {
  /** Seconds, capped at 3,599,999. */
  playTime: number;
}

const phaseId = (stage: number) =>
  stage.toString(16).toUpperCase().padStart(8, "0");

export function readUser(units: UnitStore): User {
  const at = units.of(SAVE_WIDE);
  const stage = at.get(LOCATION_STAGE);
  return {
    slotVersion: at.get(SAVE_SLOT_VERSION),
    featureVersion: at.get(SAVE_FEATURE_VERSION),
    playerName: at.get(USER_PLAYER_NAME),
    commendations: at.get(USER_COMMENDATIONS),
    onlineStatusFlags: at.get(USER_ONLINE_STATUS_FLAGS),
    stage: stage === undefined ? undefined : phaseId(stage),
    spot: at.get(LOCATION_SPOT),
    partyHp: at.get(LOCATION_PARTY_HP).find((hp) => hp !== 0) ?? 0,
  };
}

export function readSystem(units: UnitStore): System {
  return { playTime: Number(units.of(SAVE_WIDE).get(SYSTEM_PLAY_TIME)) };
}
