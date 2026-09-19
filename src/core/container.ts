import { ByteReader } from "./bytes";
import { SaveFormatError } from "./errors";

export const FILE_SIZE = 0x1600000;
export const HEADER_SIZE = 0x34;
export const CHECKSUM_COUNT = 10;
/** Checksum offset u64, checksum byte count u64, u32 always 1. */
export const FOOTER_SIZE = 0x14;

export interface SaveHeader {
  mainVersion: number;
  steamId: bigint;
  subVersion: number;
  systemDataOffset: number;
  slotDataOffset: number;
  systemDataSize: number;
  /** Includes checksums and footer. */
  slotDataSize: number;
}

export interface SaveContainer {
  header: SaveHeader;
  /** SystemData FlatBuffer. */
  systemData: Uint8Array;
  /** SlotData FlatBuffer, without checksums and footer. */
  slotData: Uint8Array;
  /** xxHash64 checksums stored after the SlotData FlatBuffer. */
  checksums: bigint[];
}

export function readHeader(reader: ByteReader): SaveHeader {
  reader.check(0, HEADER_SIZE, "header");
  return {
    mainVersion: reader.u32(0x00),
    steamId: reader.u64(0x04),
    subVersion: reader.u32(0x10),
    systemDataOffset: reader.u64Number(0x14, "SystemData offset"),
    slotDataOffset: reader.u64Number(0x1c, "SlotData offset"),
    systemDataSize: reader.u64Number(0x24, "SystemData size"),
    slotDataSize: reader.u64Number(0x2c, "SlotData size"),
  };
}

/** Splits a save file into header, both FlatBuffers and the SlotData checksums. */
export function readContainer(bytes: Uint8Array): SaveContainer {
  const reader = new ByteReader(bytes);
  const header = readHeader(reader);

  reader.check(header.systemDataOffset, header.systemDataSize, "SystemData");
  reader.check(header.slotDataOffset, header.slotDataSize, "SlotData");
  if (header.slotDataSize < FOOTER_SIZE) {
    throw new SaveFormatError({
      code: "noFooterRoom",
      slotDataSize: header.slotDataSize,
    });
  }

  const slot = new ByteReader(
    bytes.subarray(
      header.slotDataOffset,
      header.slotDataOffset + header.slotDataSize,
    ),
  );
  const footerAt = header.slotDataSize - FOOTER_SIZE;
  const checksumOffset = slot.u64Number(footerAt, "checksum offset");
  const checksumBytes = slot.u64Number(footerAt + 8, "checksum byte count");

  if (
    checksumBytes !== CHECKSUM_COUNT * 8 ||
    checksumOffset + checksumBytes !== footerAt
  ) {
    throw new SaveFormatError({
      code: "footerMisaligned",
      checksumOffset,
      checksumBytes,
      footerAt,
    });
  }

  const checksums = Array.from({ length: CHECKSUM_COUNT }, (_, i) =>
    slot.u64(checksumOffset + i * 8),
  );

  return {
    header,
    systemData: bytes.subarray(
      header.systemDataOffset,
      header.systemDataOffset + header.systemDataSize,
    ),
    slotData: slot.bytes.subarray(0, checksumOffset),
    checksums,
  };
}
