"use client";

import { STORE_PREFIX, reloadActivity } from "./store";
import { reloadProgress } from "./progress";
import { reloadSrs } from "./srs";
import { reloadQuizStats } from "./quizStats";
import { reloadDrills, reloadQuestionSrs } from "./interviewState";

const FORMAT = "first-principles-backup";

function learnerKeys() {
  return Object.keys(localStorage).filter((k) => k.startsWith(STORE_PREFIX));
}

function reloadAll() {
  reloadProgress();
  reloadSrs();
  reloadQuizStats();
  reloadActivity();
  reloadQuestionSrs();
  reloadDrills();
}

/** Every `fp:*` key (progress, reviews, quiz history, self-assessment, theme) as a JSON file. */
export function downloadBackup() {
  const data = Object.fromEntries(learnerKeys().map((k) => [k, localStorage.getItem(k)]));
  const blob = new Blob([JSON.stringify({ format: FORMAT, version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `first-principles-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Replaces all learner data with the backup's contents. Throws on a file that isn't a backup. */
export async function restoreBackup(file: File) {
  const parsed = JSON.parse(await file.text());
  if (parsed?.format !== FORMAT || typeof parsed.data !== "object") throw new Error("Not a First Principles backup file.");
  const entries = Object.entries(parsed.data as Record<string, unknown>).filter(
    (e): e is [string, string] => e[0].startsWith(STORE_PREFIX) && typeof e[1] === "string",
  );
  learnerKeys().forEach((k) => localStorage.removeItem(k));
  entries.forEach(([k, v]) => localStorage.setItem(k, v));
  reloadAll();
  return entries.length;
}

export function resetAll() {
  learnerKeys()
    .filter((k) => k !== `${STORE_PREFIX}theme`)
    .forEach((k) => localStorage.removeItem(k));
  reloadAll();
}
