// Standard xxHash64, the hash behind the SlotData checksums.

const MASK = 0xffffffffffffffffn;
const PRIME1 = 0x9e3779b185ebca87n;
const PRIME2 = 0xc2b2ae3d27d4eb4fn;
const PRIME3 = 0x165667b19e3779f9n;
const PRIME4 = 0x85ebca77c2b2ae63n;
const PRIME5 = 0x27d4eb2f165667c5n;

const rotl = (x: bigint, r: bigint) => ((x << r) | (x >> (64n - r))) & MASK;
const round = (lane: bigint, input: bigint) =>
  (rotl((lane + input * PRIME2) & MASK, 31n) * PRIME1) & MASK;
const merge = (h: bigint, lane: bigint) =>
  ((h ^ round(0n, lane)) * PRIME1 + PRIME4) & MASK;

export function xxhash64(input: Uint8Array, seed = 0n): bigint {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const length = input.length;
  let p = 0;
  let h: bigint;

  if (length >= 32) {
    let v1 = (seed + PRIME1 + PRIME2) & MASK;
    let v2 = (seed + PRIME2) & MASK;
    let v3 = seed & MASK;
    let v4 = (seed - PRIME1) & MASK;
    for (const end = length - 32; p <= end; p += 32) {
      v1 = round(v1, view.getBigUint64(p, true));
      v2 = round(v2, view.getBigUint64(p + 8, true));
      v3 = round(v3, view.getBigUint64(p + 16, true));
      v4 = round(v4, view.getBigUint64(p + 24, true));
    }
    h = (rotl(v1, 1n) + rotl(v2, 7n) + rotl(v3, 12n) + rotl(v4, 18n)) & MASK;
    h = merge(merge(merge(merge(h, v1), v2), v3), v4);
  } else {
    h = (seed + PRIME5) & MASK;
  }

  h = (h + BigInt(length)) & MASK;
  for (; p + 8 <= length; p += 8) {
    h ^= round(0n, view.getBigUint64(p, true));
    h = (rotl(h, 27n) * PRIME1 + PRIME4) & MASK;
  }
  if (p + 4 <= length) {
    h ^= (BigInt(view.getUint32(p, true)) * PRIME1) & MASK;
    h = (rotl(h, 23n) * PRIME2 + PRIME3) & MASK;
    p += 4;
  }
  for (; p < length; p++) {
    h ^= (BigInt(input[p]!) * PRIME5) & MASK;
    h = (rotl(h, 11n) * PRIME1) & MASK;
  }

  h = ((h ^ (h >> 33n)) * PRIME2) & MASK;
  h = ((h ^ (h >> 29n)) * PRIME3) & MASK;
  return h ^ (h >> 32n);
}
