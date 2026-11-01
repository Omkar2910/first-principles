"use client";

import { useSyncExternalStore } from "react";

/** All persisted keys share this prefix so backups can find them. */
export const STORE_PREFIX = "fp:";

/**
 * A tiny localStorage-backed store with an in-memory cache, cross-tab sync
 * and a React hook. Every piece of learner state is built on this.
 */
export function createStore<T>(key: string, fallback: T, migrate?: () => T | undefined) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function get(): T {
    if (cache !== undefined) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : (migrate?.() ?? fallback);
    } catch {
      cache = fallback;
    }
    return cache!;
  }

  function set(next: T) {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode etc.): keep in-memory only.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(cb: () => void) {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        cache = undefined;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }

  /** Drop the cache, e.g. after a backup import rewrote localStorage. */
  function reload() {
    cache = undefined;
    listeners.forEach((l) => l());
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, reload, useValue };
}

/** Local calendar day as an integer, so "due today" and streaks follow the learner's clock. */
export function dayNumber(ts = Date.now()) {
  const d = new Date(ts);
  return Math.floor((ts - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Days with any learning activity, keyed by day number → event count. */
const activity = createStore<Record<number, number>>(`${STORE_PREFIX}activity:v1`, {});

export function logActivity() {
  const today = dayNumber();
  const current = activity.get();
  activity.set({ ...current, [today]: (current[today] ?? 0) + 1 });
}

export const useActivity = activity.useValue;
export const reloadActivity = activity.reload;
