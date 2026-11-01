"use client";

import Link from "next/link";
import { lessonId, useCompleted } from "@/lib/progress";
import { useDueCount } from "./client";
import { Card, Eyebrow, ProgressBar } from "@/components/ui";

type Item = { track: string; slug: string; title: string; trackTitle: string };

/** Suggests the next lesson: the first unfinished one in a track you've started, else the first unfinished overall. */
export function ContinueLearning({ lessons }: { lessons: Item[] }) {
  const completed = useCompleted();
  const dueCount = useDueCount();
  const done = (l: Item) => completed.includes(lessonId(l.track, l.slug));
  const total = lessons.length;
  const doneCount = lessons.filter(done).length;

  const startedTracks = new Set(lessons.filter(done).map((l) => l.track));
  const next =
    lessons.find((l) => startedTracks.has(l.track) && !done(l)) ?? lessons.find((l) => !done(l));

  return (
    <Card className="p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-baseline justify-between text-sm">
        <Eyebrow>{doneCount === 0 ? "Start here" : "Continue learning"}</Eyebrow>
        <span className="text-xs tabular-nums text-slate-500">
          {doneCount}/{total} lessons
        </span>
      </div>
      <ProgressBar value={(doneCount / total) * 100} className="mt-3" />
      {next ? (
        <Link
          href={`/tracks/${next.track}/${next.slug}`}
          className="group mt-4 block rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
        >
          <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{next.trackTitle}</div>
          <div className="mt-0.5 font-semibold">{next.title}</div>
          <div className="mt-3 text-sm font-medium text-slate-600 group-hover:text-brand-700 dark:text-slate-300 dark:group-hover:text-brand-300">
            {doneCount === 0 ? "Begin" : "Resume"} →
          </div>
        </Link>
      ) : (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">You&apos;ve completed every lesson. Time for the review deck!</p>
      )}
      {dueCount > 0 && (
        <Link
          href="/review"
          className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm transition-colors hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-500/40"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold tabular-nums text-white">
              {dueCount}
            </span>
            card{dueCount === 1 ? "" : "s"} ready to review
          </span>
          <span aria-hidden className="text-slate-400">→</span>
        </Link>
      )}
    </Card>
  );
}
