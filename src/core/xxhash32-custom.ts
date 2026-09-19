// Port of GBFRDataTools XXHash32Custom: xxHash32 with the game's own seed and lanes.

const PRIME1 = 0x9e3779b1;
const PRIME2 = 0x85ebca77;
const PRIME3 = 0xc2b2ae3d;
const PRIME4 = 0x27d4eb2f;
const PRIME5 = 0x165667b1;

const rotl = (x: number, r: number) => ((x << r) | (x >>> (32 - r))) >>> 0;
const round = (lane: number, input: number) =>
  Math.imul(rotl((lane + Math.imul(input, PRIME2)) >>> 0, 13), PRIME1) >>> 0;

export function xxhash32Custom(input: Uint8Array): number {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  let p = 0;
  let remaining = input.length;
  let h = 0x178a54a4;

  if (input.length >= 16) {
    let v1 = 0x2557311b;
    let v2 = 0x871fb76a;
    let v3 = 0x0133ecf3;
    let v4 = 0x62fc7342;
    // Upstream loops while more than 16 bytes remain, so an exact 16-byte tail skips the lanes.
    do {
      v1 = round(v1, view.getUint32(p, true));
      v2 = round(v2, view.getUint32(p + 4, true));
      v3 = round(v3, view.getUint32(p + 8, true));
      v4 = round(v4, view.getUint32(p + 12, true));
      p += 16;
      remaining -= 16;
    } while (remaining > 16);
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
  }

  h = (h + input.length) >>> 0;

  for (; remaining >= 4; p += 4, remaining -= 4) {
    h =
      Math.imul(
        rotl((h + Math.imul(view.getUint32(p, true), PRIME3)) >>> 0, 17),
        PRIME4,
      ) >>> 0;
  }
  for (; remaining > 0; p++, remaining--) {
    h =
      Math.imul(rotl((h + Math.imul(input[p]!, PRIME5)) >>> 0, 11), PRIME1) >>>
      0;
  }

  h ^= h >>> 15;
  h = Math.imul(h, PRIME2) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, PRIME3) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Hash of an ASCII id string such as "PL0500". */
export function hashId(id: string): number {
  const bytes = new Uint8Array(id.length);
  for (let i = 0; i < id.length; i++) bytes[i] = id.charCodeAt(i) & 0x7f;
  return xxhash32Custom(bytes);
}
