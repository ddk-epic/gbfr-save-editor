type Plain = Record<string, unknown>;

const isObject = (v: unknown): v is Plain =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const idOf = (v: unknown) =>
  isObject(v) && typeof v.id === "string" ? v.id : undefined;

// Keeps prev wherever next is structurally equal, matching array items by id or index.
export function reuse<T>(prev: T, next: T): T {
  const a: unknown = prev;
  const b: unknown = next;
  if (Array.isArray(a) && Array.isArray(b)) {
    const byId = new Map<string, unknown>();
    for (const item of a) {
      const id = idOf(item);
      if (id !== undefined) byId.set(id, item);
    }
    const merged = b.map((item: unknown, i) => {
      const id = idOf(item);
      const old = id === undefined ? a[i] : byId.get(id);
      return old === undefined ? item : reuse(old, item);
    });
    const same =
      a.length === merged.length && merged.every((x, i) => Object.is(x, a[i]));
    return (same ? prev : merged) as T;
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(b);
    const merged: Plain = {};
    for (const k of keys) merged[k] = reuse(a[k], b[k]);
    const same =
      keys.length === Object.keys(a).length &&
      keys.every((k) => k in a && Object.is(merged[k], a[k]));
    return (same ? prev : merged) as T;
  }
  return Object.is(a, b) ? prev : next;
}
