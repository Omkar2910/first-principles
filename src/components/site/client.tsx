"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { ProgressBar, ProgressRing, buttonClass } from "@/components/ui";
import { lessonId, toggleCompleted, useCompleted, useCompletions } from "@/lib/progress";
import { dueQueue, useSrs } from "@/lib/srs";

/* ---------- Theme ---------- */

function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("fp:theme", next ? "dark" : "light");
        } catch {}
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        {dark ? (
          <>
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
          </>
        ) : (
          <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" />
        )}
      </svg>
    </button>
  );
}

/* ---------- Progress ---------- */

export function MarkComplete({ track, slug, next }: { track: string; slug: string; next?: { href: string; title: string } }) {
  const id = lessonId(track, slug);
  const done = useCompleted().includes(id);
  const router = useRouter();
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        done
          ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/5"
          : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40"
      }`}
    >
      <div>
        <div className="font-semibold">{done ? "Lesson complete" : "Finished reading?"}</div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {done ? "It's now in your spaced review rotation." : "Mark it complete to track progress and add it to your review deck."}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => toggleCompleted(id)} className={buttonClass(done ? "ghost" : "secondary", "md")}>
          {done ? "Undo" : "Mark complete"}
        </button>
        {next && (
          <button
            onClick={() => {
              if (!done) toggleCompleted(id);
              router.push(next.href);
            }}
            className={buttonClass("brand", "md")}
          >
            {done ? "Next lesson" : "Complete & continue"} →
          </button>
        )}
      </div>
    </div>
  );
}

export function TrackProgress({ track, slugs }: { track: string; slugs: string[] }) {
  const completed = useCompleted();
  const done = slugs.filter((s) => completed.includes(lessonId(track, s))).length;
  const pct = slugs.length ? (done / slugs.length) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <ProgressBar value={pct} className="flex-1" />
      <span className="tabular-nums">
        {done}/{slugs.length}
      </span>
    </div>
  );
}

/** Status for a roadmap card: a progress ring plus "Not started / In progress / Complete". */
export function TrackStatus({ track, slugs }: { track: string; slugs: string[] }) {
  const completed = useCompleted();
  const done = slugs.filter((s) => completed.includes(lessonId(track, s))).length;
  const pct = slugs.length ? (done / slugs.length) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <ProgressRing value={pct} size={34}>
        {done === slugs.length ? "✓" : done}
      </ProgressRing>
      <div className="text-xs leading-tight">
        <div className={`font-medium ${done === slugs.length ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
          {done === 0 ? "Not started" : done === slugs.length ? "Complete" : "In progress"}
        </div>
        <div className="text-slate-500">
          {done}/{slugs.length} lessons
        </div>
      </div>
    </div>
  );
}

/** "Start" / "Continue" button pointing at the first unfinished lesson in a track. */
export function TrackCta({ track, slugs }: { track: string; slugs: string[] }) {
  const completed = useCompleted();
  const next = slugs.find((s) => !completed.includes(lessonId(track, s)));
  const started = slugs.some((s) => completed.includes(lessonId(track, s)));
  if (!next) return <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✓ Track complete</span>;
  return (
    <Link href={`/tracks/${track}/${next}`} className={buttonClass("brand", "lg")}>
      {started ? "Continue track" : "Start track"} →
    </Link>
  );
}

export function LessonLink({
  track,
  slug,
  title,
  index,
  active,
}: {
  track: string;
  slug: string;
  title: string;
  index: number;
  active?: boolean;
}) {
  const done = useCompleted().includes(lessonId(track, slug));
  return (
    <Link
      href={`/tracks/${track}/${slug}`}
      aria-current={active ? "page" : undefined}
      className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active
          ? "bg-brand-50 font-medium text-brand-900 dark:bg-brand-500/10 dark:text-brand-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
      }`}
    >
      <LessonDot done={done} active={active} index={index} />
      <span className="pt-px">{title}</span>
    </Link>
  );
}

export function LessonDot({ done, active, index }: { done: boolean; active?: boolean; index: number }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ${
        done
          ? "bg-emerald-500 text-white"
          : active
            ? "bg-brand-600 text-white"
            : "border border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
      }`}
    >
      {done ? "✓" : index}
    </span>
  );
}

/** A lesson row on the track page: whole row links, completion dot on the left. */
export function LessonRow({
  track,
  slug,
  title,
  description,
  index,
  meta,
}: {
  track: string;
  slug: string;
  title: string;
  description: string;
  index: number;
  meta: ReactNode;
}) {
  const done = useCompleted().includes(lessonId(track, slug));
  return (
    <Link
      href={`/tracks/${track}/${slug}`}
      className="group flex gap-4 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 dark:hover:bg-slate-800/40"
    >
      <LessonDot done={done} index={index} />
      <div className="min-w-0 flex-1">
        <div className="font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300">{title}</div>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">{meta}</div>
    </Link>
  );
}

/* ---------- Review ---------- */

/** Number of review cards waiting today; renders nothing when zero. */
export function DueBadge() {
  const count = useDueCount();
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold tabular-nums text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function useDueCount() {
  const { due, fresh } = dueQueue(useSrs(), useCompletions());
  return due.length + fresh.length;
}
