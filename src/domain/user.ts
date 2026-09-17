import type { UnitStore } from "../format/unit-store";
import { ID } from "./layout";

/** The account-wide SlotData values, 1001-1207. */
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

/** Characters up to the first 0. */
const text = (codes: readonly number[]) => {
  const end = codes.indexOf(0);
  return String.fromCharCode(...(end === -1 ? codes : codes.slice(0, end)));
};

const phaseId = (stage: number) =>
  stage.toString(16).toUpperCase().padStart(8, "0");

export function readUser(units: UnitStore): User {
  const int = (id: number) => units.values(id, 0, "int")?.[0] ?? 0;
  const stage = units.values(ID.LOCATION_STAGE, 0, "int")?.[0];
  return {
    slotVersion: units.values(ID.SAVE_SLOT_VERSION, 0, "ushort")?.[0],
    featureVersion: units.values(ID.SAVE_FEATURE_VERSION, 0, "ushort")?.[0],
    playerName: text(units.values(ID.USER_PLAYER_NAME, 0, "ushort") ?? []),
    commendations: int(ID.USER_COMMENDATIONS),
    onlineStatusFlags:
      units.values(ID.USER_ONLINE_STATUS_FLAGS, 0, "uint")?.[0] ?? 0,
    stage: stage === undefined ? undefined : phaseId(stage),
    spot: text(units.values(ID.LOCATION_SPOT, 0, "ubyte") ?? []),
    partyHp:
      units.values(ID.LOCATION_PARTY_HP, 0, "int")?.find((hp) => hp !== 0) ?? 0,
  };
}

export function readSystem(units: UnitStore): System {
  return {
    playTime: Number(units.values(ID.SYSTEM_PLAY_TIME, 0, "ulong")?.[0] ?? 0n),
  };
}
