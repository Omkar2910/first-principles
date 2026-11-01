"use client";

import { STORE_PREFIX, createStore, dayNumber, logActivity } from "./store";

/** Scheduling state for one lesson's review card (a simplified SM-2). */
export type CardState = {
  /** Day number the card is next due. */
  due: number;
  /** Current gap in days. */
  interval: number;
  /** Growth factor applied to the interval on a "good" answer. */
  ease: number;
  /** Successful reviews in a row. */
  reps: number;
  lapses: number;
};

export type Rating = "again" | "hard" | "good" | "easy";

const store = createStore<Record<string, CardState>>(`${STORE_PREFIX}srs:v1`, {});

export const useSrs = store.useValue;
export const reloadSrs = store.reload;

const MIN_EASE = 1.3;

export function schedule(prev: CardState | undefined, rating: Rating, today = dayNumber()): CardState {
  const card = prev ?? { due: today, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
  const { reps, lapses } = card;
  let { interval, ease } = card;

  switch (rating) {
    case "again":
      // Forgotten: start over, and see it again later in this session.
      return { due: today, interval: 0, ease: Math.max(MIN_EASE, ease - 0.2), reps: 0, lapses: lapses + 1 };
    case "hard":
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;
    case "good":
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
      break;
    case "easy":
      interval = reps === 0 ? 4 : Math.round(Math.max(interval, 1) * ease * 1.3);
      ease += 0.15;
      break;
  }
  return { due: today + interval, interval, ease, reps: reps + 1, lapses };
}

/** Short label for the button, e.g. "3d" or "now". */
export function previewInterval(prev: CardState | undefined, rating: Rating) {
  const days = schedule(prev, rating, 0).due;
  if (days === 0) return "now";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function rate(id: string, rating: Rating) {
  const all = store.get();
  store.set({ ...all, [id]: schedule(all[id], rating) });
  logActivity();
}

/**
 * Lessons waiting for review: scheduled cards that are due, then completed
 * lessons that have never been reviewed ("new"), oldest completion first.
 */
export function dueQueue(srs: Record<string, CardState>, completions: Record<string, number>, today = dayNumber()) {
  const due = Object.entries(srs)
    .filter(([, c]) => c.due <= today)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
  const fresh = Object.entries(completions)
    .filter(([id]) => !srs[id])
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
  return { due, fresh };
}
