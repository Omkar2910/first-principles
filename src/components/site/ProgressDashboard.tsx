"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { useRef, useState, useSyncExternalStore } from "react";
import { useCompletions } from "@/lib/progress";
import { useQuizStats } from "@/lib/quizStats";
import { dueQueue, useSrs } from "@/lib/srs";
import { dayNumber, useActivity } from "@/lib/store";
import { downloadBackup, resetAll, restoreBackup } from "@/lib/backup";

type TrackSummary = { slug: string; title: string; number: number; lessons: string[]; questions: string[] };

const WEEKS = 20;
const noopSubscribe = () => () => {};
const DAY_MS = 86_400_000;

/** Current streak (today or yesterday counts as "still alive") and the longest run ever. */
function streaks(days: Set<number>, today: number) {
  let current = 0;
  let d = days.has(today) ? today : today - 1;
  while (days.has(d)) {
    current++;
    d--;
  }
  let longest = 0;
  let run = 0;
  let prev = -Infinity;
  for (const day of [...days].sort((a, b) => a - b)) {
    run = day === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return { current, longest };
}

export function ProgressDashboard({ tracks }: { tracks: TrackSummary[] }) {
  const completions = useCompletions();
  const quiz = useQuizStats();
  const srs = useSrs();
  const activity = useActivity();
  // Dates depend on the viewer's clock, so render only in the browser.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="h-96 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-900" />;
  const today = dayNumber();

  const totalLessons = tracks.reduce((a, t) => a + t.lessons.length, 0);
  const done = Object.keys(completions).length;
  const activeDays = new Set(Object.keys(activity).map(Number));
  const { current, longest } = streaks(activeDays, today);
  const { due, fresh } = dueQueue(srs, completions, today);

  const seen = Object.values(quiz).reduce((a, r) => a + r.seen, 0);
  const correct = Object.values(quiz).reduce((a, r) => a + r.correct, 0);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={`${done}`} sub={`of ${totalLessons}`} label="lessons completed" />
        <Tile value={`${current}`} sub={current === 1 ? "day" : "days"} label={`streak · best ${longest}`} />
        <Tile value={seen ? `${Math.round((correct / seen) * 100)}%` : "–"} sub={seen ? `${seen} answers` : ""} label="quiz accuracy" />
        <Tile value={`${due.length + fresh.length}`} sub="cards" label="ready to review" href="/review" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Activity · last {WEEKS} weeks</h2>
        <Heatmap activity={activity} today={today} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">By track</h2>
        <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-500">
              <tr className="border-b border-ink-200 dark:border-ink-800">
                <th className="px-4 py-2 font-medium">Track</th>
                <th className="w-2/5 px-4 py-2 font-medium">Lessons</th>
                <th className="px-4 py-2 text-right font-medium">Quiz accuracy</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => {
                const d = t.lessons.filter((id) => id in completions).length;
                const attempts = t.questions.map((q) => quiz[q]).filter(Boolean);
                const s = attempts.reduce((a, r) => a + r.seen, 0);
                const c = attempts.reduce((a, r) => a + r.correct, 0);
                return (
                  <tr key={t.slug} className="border-b border-ink-100 last:border-0 dark:border-ink-800/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/tracks/${t.slug}`} className="hover:underline">
                        <span className="mr-2 font-mono text-xs text-ink-400">{String(t.number).padStart(2, "0")}</span>
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(d / t.lessons.length) * 100}%` }} />
                        </div>
                        <span className="w-12 text-right text-xs tabular-nums text-ink-500">
                          {d}/{t.lessons.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {s ? (
                        <span title={`${c} of ${s} answers correct`}>{Math.round((c / s) * 100)}%</span>
                      ) : (
                        <span className="text-ink-400">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Backup />
    </div>
  );
}

function Tile({ value, sub, label, href }: { value: string; sub?: string; label: string; href?: string }) {
  const body = (
    <div className={`h-full rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900/40 ${href ? "hover:border-ink-400 dark:hover:border-ink-600" : ""}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        {sub && <span className="text-xs text-ink-500">{sub}</span>}
      </div>
      <div className="mt-1 text-xs text-ink-500">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** One emerald hue, light → dark by activity count. Level 0 is the empty-cell gray. */
const LEVELS = [
  "bg-ink-100 dark:bg-ink-800",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
  "bg-emerald-800 dark:bg-emerald-300",
];

function level(n: number) {
  if (!n) return 0;
  if (n <= 2) return 1;
  if (n <= 5) return 2;
  if (n <= 10) return 3;
  return 4;
}

function Heatmap({ activity, today }: { activity: Record<number, number>; today: number }) {
  const [hover, setHover] = useState<{ day: number; x: number; y: number } | null>(null);
  // Columns are weeks starting Sunday; the last column holds today.
  // Day 0 (1 Jan 1970) was a Thursday.
  const todayWeekday = (today + 4) % 7;
  const start = today - todayWeekday - (WEEKS - 1) * 7;
  const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => start + w * 7 + d));
  const fmt = (day: number) =>
    // Day numbers are local dates expressed as UTC days, so format them in UTC.
    new Date(day * DAY_MS).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div className="relative rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900/40">
      <div className="flex gap-[3px] overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
        {columns.map((week) => (
          <div key={week[0]} className="flex flex-col gap-[3px]">
            {week.map((day) =>
              day > today ? (
                <div key={day} className="h-3 w-3" />
              ) : (
                <div
                  key={day}
                  role="img"
                  aria-label={`${fmt(day)}: ${activity[day] ?? 0} activities`}
                  onMouseEnter={(e) => {
                    const box = e.currentTarget.getBoundingClientRect();
                    const parent = e.currentTarget.closest(".relative")!.getBoundingClientRect();
                    setHover({ day, x: box.left - parent.left + 6, y: box.top - parent.top });
                  }}
                  className={`h-3 w-3 rounded-[3px] ${LEVELS[level(activity[day] ?? 0)]} ${day === today ? "ring-1 ring-ink-400" : ""}`}
                />
              ),
            )}
          </div>
        ))}
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow dark:bg-white dark:text-ink-900"
          style={{ left: hover.x, top: hover.y - 4 }}
        >
          <span className="font-semibold">{activity[hover.day] ?? 0}</span> {(activity[hover.day] ?? 0) === 1 ? "activity" : "activities"} · {fmt(hover.day)}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
        <span>Lessons completed, quiz answers and reviews all count.</span>
        <span className="flex items-center gap-1">
          Less
          {LEVELS.map((c) => (
            <span key={c} className={`h-3 w-3 rounded-[3px] ${c}`} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function Backup() {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 dark:border-ink-800 dark:bg-ink-900/40">
      <h2 className="font-semibold">Your data</h2>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
        Progress lives only in this browser. Download a backup to move it to another device or keep it safe.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button onClick={downloadBackup} className={buttonClass("primary", "sm")}>
          Download backup
        </button>
        <button onClick={() => input.current?.click()} className={buttonClass("secondary", "sm")}>
          Restore from file…
        </button>
        <button
          onClick={() => {
            if (confirm("Erase all progress, reviews, quiz history and self-assessment answers in this browser?")) {
              resetAll();
              location.reload();
            }
          }}
          className="ml-auto rounded-lg px-3 py-1.5 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          Reset everything
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!confirm("Replace the progress in this browser with this backup?")) return;
            try {
              await restoreBackup(file);
              location.reload();
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Could not read that file.");
            }
          }}
        />
      </div>
      {message && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{message}</p>}
    </section>
  );
}
