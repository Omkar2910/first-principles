"use client";

import { dayNumber } from "@/lib/store";
import { isDue, useDrillAttempts, useQuestionSrs } from "@/lib/interviewState";
import { StatTile } from "@/components/ui";

/** Best score on a drill, or "Not tried". */
export function DrillStatus({ id }: { id: string }) {
  const attempts = useDrillAttempts()[id] ?? [];
  if (!attempts.length) return <span className="text-xs text-ink-500">Not tried</span>;
  const best = attempts.reduce((b, a) => (a.checked / a.total > b.checked / b.total ? a : b));
  return (
    <span className="text-xs text-emerald-700 dark:text-emerald-400">
      Best {best.checked}/{best.total} · {attempts.length} attempt{attempts.length === 1 ? "" : "s"}
    </span>
  );
}

/** Interview-prep progress tiles for the hub page. */
export function InterviewStats({ questionIds, drillCount }: { questionIds: string[]; drillCount: number }) {
  const srs = useQuestionSrs();
  const attempts = useDrillAttempts();
  const today = dayNumber();
  const rated = questionIds.filter((id) => srs[id]);
  const strong = rated.filter((id) => srs[id].reps >= 2).length;
  const due = rated.filter((id) => isDue(srs[id], today)).length;
  const drillsDone = Object.values(attempts).filter((a) => a.length > 0).length;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile value={rated.length} sub={`of ${questionIds.length}`} label="questions tried" />
      <StatTile value={strong} label="answered well twice or more" />
      <StatTile value={due} label="due for another try" />
      <StatTile value={drillsDone} sub={`of ${drillCount}`} label="drills completed" />
    </div>
  );
}
