"use client";

import { STORE_PREFIX, createStore, dayNumber, logActivity } from "./store";
import { schedule, type CardState, type Rating } from "./srs";

/* ---------- Question bank: self-ratings scheduled like review cards ---------- */

const questions = createStore<Record<string, CardState>>(`${STORE_PREFIX}interview-srs:v1`, {});

export const useQuestionSrs = questions.useValue;
export const reloadQuestionSrs = questions.reload;

/** How it felt to answer out loud, mapped onto the review scheduler. */
export const ANSWER_RATINGS = [
  { value: "missed", label: "Missed it", rating: "again" },
  { value: "shaky", label: "Shaky", rating: "hard" },
  { value: "solid", label: "Solid", rating: "good" },
  { value: "nailed", label: "Nailed it", rating: "easy" },
] as const satisfies readonly { value: string; label: string; rating: Rating }[];

export function rateQuestion(id: string, rating: Rating) {
  const all = questions.get();
  questions.set({ ...all, [id]: schedule(all[id], rating) });
  logActivity();
}

/** A question is due when it was rated before and its next review day has arrived. */
export function isDue(card: CardState | undefined, today = dayNumber()) {
  return !!card && card.due <= today;
}

/* ---------- System design drills ---------- */

export type DrillAttempt = { at: number; checked: number; total: number; minutes: number };

const attempts = createStore<Record<string, DrillAttempt[]>>(`${STORE_PREFIX}drills:v1`, {});
const notes = createStore<Record<string, string>>(`${STORE_PREFIX}drill-notes:v1`, {});

export const useDrillAttempts = attempts.useValue;
export const useDrillNotes = notes.useValue;
export const reloadDrills = () => {
  attempts.reload();
  notes.reload();
};

export function saveDrillNotes(id: string, text: string) {
  notes.set({ ...notes.get(), [id]: text });
}

export function recordDrill(id: string, attempt: DrillAttempt) {
  const all = attempts.get();
  attempts.set({ ...all, [id]: [...(all[id] ?? []), attempt] });
  logActivity();
}
