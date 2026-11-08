import { decodeSaveDataBinary } from "./save-data-binary";
import { readContainer, type SaveHeader } from "./container";
import { UnitStore } from "./unit-store";

export interface SaveSection {
  /** VersionMaybe from the FlatBuffer root. */
  version: number | undefined;
  units: UnitStore;
}

export interface Save {
  header: SaveHeader;
  checksums: bigint[];
  systemData: SaveSection;
  slotData: SaveSection;
}

function readSection(bytes: Uint8Array): SaveSection {
  const binary = decodeSaveDataBinary(bytes);
  return { version: binary.version, units: new UnitStore(binary.units) };
}

/** Reads a whole SaveData*.dat file. */
export function readSave(bytes: Uint8Array): Save {
  const container = readContainer(bytes);
  return {
    header: container.header,
    checksums: container.checksums,
    systemData: readSection(container.systemData),
    slotData: readSection(container.slotData),
  };
}
