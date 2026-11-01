"use client";

import { STORE_PREFIX, createStore, logActivity } from "./store";

/** Per-question history, keyed by the question text (unique across lessons). */
export type QuizRecord = { seen: number; correct: number; lastCorrect: boolean; at: number };

const store = createStore<Record<string, QuizRecord>>(`${STORE_PREFIX}quiz:v1`, {});

export const useQuizStats = store.useValue;
export const reloadQuizStats = store.reload;

export function recordAnswer(question: string, correct: boolean) {
  const all = store.get();
  const prev = all[question] ?? { seen: 0, correct: 0, lastCorrect: false, at: 0 };
  store.set({
    ...all,
    [question]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), lastCorrect: correct, at: Date.now() },
  });
  logActivity();
}
