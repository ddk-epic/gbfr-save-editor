import { CHECKSUM_COUNT } from "./container";
import { xxhash64 } from "./xxhash64";

export const CHECKSUM_SEED = 0x2f1a43ebcdn;

/** Start and end trim of each hashed range, GBFRDataTools `HashSectionInfos`. */
const RANGES: readonly (readonly [start: number, sub: number])[] = [
  [0x58, 0x80],
  [0x30, 0xa0],
  [0x28, 0x30],
  [0x38, 0xc0],
  [0x40, 0xb0],
  [0x68, 0x50],
  [0x48, 0x60],
  [0x70, 0x90],
  [0x50, 0x40],
  [0x60, 0x70],
];

/** The one checksum the game checks, picked by `SAVE_HASHSEED`. */
export const checksumIndex = (hashSeed: number) => hashSeed % CHECKSUM_COUNT;

/** Checksum `index` over the SlotData FlatBuffer, checksums and footer excluded. */
export function slotChecksum(flatBuffer: Uint8Array, index: number): bigint {
  const [start, sub] = RANGES[index]!;
  return xxhash64(
    flatBuffer.subarray(start, flatBuffer.length - sub),
    CHECKSUM_SEED,
  );
}
