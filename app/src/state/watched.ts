import { useSyncExternalStore } from "react";

/** A value outside React that components subscribe to. */
export class Watched<T> {
  private readonly listeners = new Set<() => void>();

  constructor(private value: T) {}

  get = () => this.value;

  set = (next: T) => {
    if (Object.is(next, this.value)) return;
    this.value = next;
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
}

/** The part of `watched` that `select` picks, re-rendering only when that part changes. */
export function useWatched<T, S = T>(
  watched: Watched<T>,
  select: (value: T) => S = (value) => value as unknown as S,
): S {
  return useSyncExternalStore(watched.subscribe, () => select(watched.get()));
}
