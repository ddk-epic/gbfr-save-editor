import { SaveFormatError } from "../errors";

/** Little-endian reader that throws SaveFormatError on out-of-range reads. */
export class ByteReader {
  readonly bytes: Uint8Array;
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get length(): number {
    return this.bytes.byteLength;
  }

  check(at: number, size: number, what: string): void {
    if (!Number.isInteger(at) || at < 0 || at + size > this.length) {
      throw new SaveFormatError(
        `${what} at 0x${at.toString(16)} (${size} B) is outside 0x${this.length.toString(16)} B`,
      );
    }
  }

  u8(at: number): number {
    this.check(at, 1, "u8");
    return this.view.getUint8(at);
  }

  i8(at: number): number {
    this.check(at, 1, "i8");
    return this.view.getInt8(at);
  }

  u16(at: number): number {
    this.check(at, 2, "u16");
    return this.view.getUint16(at, true);
  }

  i16(at: number): number {
    this.check(at, 2, "i16");
    return this.view.getInt16(at, true);
  }

  u32(at: number): number {
    this.check(at, 4, "u32");
    return this.view.getUint32(at, true);
  }

  i32(at: number): number {
    this.check(at, 4, "i32");
    return this.view.getInt32(at, true);
  }

  u64(at: number): bigint {
    this.check(at, 8, "u64");
    return this.view.getBigUint64(at, true);
  }

  i64(at: number): bigint {
    this.check(at, 8, "i64");
    return this.view.getBigInt64(at, true);
  }

  f32(at: number): number {
    this.check(at, 4, "f32");
    return this.view.getFloat32(at, true);
  }

  /** u64 used as an offset or size. */
  u64Number(at: number, what: string): number {
    const value = this.u64(at);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new SaveFormatError(`${what} 0x${value.toString(16)} is too large`);
    }
    return Number(value);
  }
}
