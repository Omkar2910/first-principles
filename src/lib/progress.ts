"use client";

import { STORE_PREFIX, createStore, logActivity } from "./store";

/** Lesson id → completion time in ms (0 when completed before dates were tracked). */
type Completions = Record<string, number>;

const LEGACY_KEY = `${STORE_PREFIX}progress:v1`;

const store = createStore<Completions>(`${STORE_PREFIX}progress:v2`, {}, () => {
  // v1 stored a bare array of ids with no dates.
  try {
    const legacy: string[] = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]");
    return Object.fromEntries(legacy.map((id) => [id, 0]));
  } catch {
    return undefined;
  }
});

export const lessonId = (track: string, slug: string) => `${track}/${slug}`;

export const useCompletions = store.useValue;
export const reloadProgress = store.reload;

let lastMap: Completions | null = null;
let lastIds: string[] = [];

/** Completed lesson ids. Stable between renders while nothing changes. */
export function useCompleted(): string[] {
  const map = store.useValue();
  if (map !== lastMap) {
    lastMap = map;
    lastIds = Object.keys(map);
  }
  return lastIds;
}

export function toggleCompleted(id: string) {
  const { [id]: existing, ...rest } = store.get();
  if (existing !== undefined) {
    store.set(rest);
  } else {
    store.set({ ...rest, [id]: Date.now() });
    logActivity();
  }
}
