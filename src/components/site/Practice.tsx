"use client";

import Link from "next/link";
import { Kbd, Segmented, StatTile, buttonClass } from "@/components/ui";
import { useEffect, useState } from "react";
import type { QuizItem } from "@/lib/content";
import { recordAnswer, useQuizStats, type QuizRecord } from "@/lib/quizStats";
import { lessonId, useCompleted } from "@/lib/progress";

type Mode = "mixed" | "weak" | "unseen";
type Scope = "all" | "completed" | string;

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "mixed", label: "Mixed", hint: "Random questions" },
  { id: "weak", label: "Weak spots", hint: "Ones you last got wrong" },
  { id: "unseen", label: "Unseen", hint: "Never attempted" },
];

const SIZES = [5, 10, 20];

function pickMode(q: QuizItem, mode: Mode, stats: Record<string, QuizRecord>) {
  const s = stats[q.question];
  if (mode === "weak") return !!s && !s.lastCorrect;
  if (mode === "unseen") return !s;
  return true;
}

function sample<T>(arr: T[], n: number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function Practice({ quizzes, tracks }: { quizzes: QuizItem[]; tracks: { slug: string; title: string }[] }) {
  const stats = useQuizStats();
  const completed = useCompleted();
  const [scope, setScope] = useState<Scope>("all");
  const [mode, setMode] = useState<Mode>("mixed");
  const [size, setSize] = useState(10);
  const [session, setSession] = useState<QuizItem[] | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const pool = quizzes.filter(
    (q) =>
      (scope === "all" || (scope === "completed" ? completed.includes(lessonId(q.track, q.slug)) : q.track === scope)) &&
      pickMode(q, mode, stats),
  );

  const attempted = quizzes.filter((q) => stats[q.question]);
  const accuracy = attempted.length
    ? Math.round((attempted.reduce((a, q) => a + stats[q.question].correct, 0) / attempted.reduce((a, q) => a + stats[q.question].seen, 0)) * 100)
    : null;
  const weakCount = quizzes.filter((q) => pickMode(q, "weak", stats)).length;

  if (session) {
    return (
      <Session
        items={session}
        results={results}
        onAnswer={(ok) => setResults((r) => [...r, ok])}
        onExit={() => { setSession(null); setResults([]); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={`${attempted.length}/${quizzes.length}`} label="questions attempted" />
        <StatTile value={accuracy === null ? "–" : `${accuracy}%`} label="first-try accuracy" />
        <StatTile value={String(weakCount)} label="weak spots" />
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <Field label="From">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full sm:w-auto h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm shadow-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">All tracks</option>
            <option value="completed">Lessons I&apos;ve completed</option>
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Questions">
          <Segmented options={MODES.map((m) => ({ value: m.id, label: m.label, title: m.hint }))} value={mode} onChange={setMode} />
        </Field>
        <Field label="Length">
          <Segmented options={SIZES.map((n) => ({ value: n, label: String(n) }))} value={size} onChange={setSize} />
        </Field>
        <button
          disabled={!pool.length}
          onClick={() => { setResults([]); setSession(sample(pool, size)); }}
          className={buttonClass("brand", "lg", "w-full")}
        >
          {pool.length ? `Start · ${Math.min(size, pool.length)} question${Math.min(size, pool.length) === 1 ? "" : "s"}` : "No questions match"}
        </button>
        {!pool.length && mode === "weak" && (
          <p className="text-center text-sm text-slate-500">No weak spots here. Nice work. Try Mixed or Unseen.</p>
        )}
      </div>
    </div>
  );
}

function Session({
  items,
  results,
  onAnswer,
  onExit,
}: {
  items: QuizItem[];
  results: boolean[];
  onAnswer: (correct: boolean) => void;
  onExit: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const index = results.length - (picked !== null ? 1 : 0);
  const q = items[index];
  const finished = results.length === items.length && picked === null;

  const next = () => setPicked(null);

  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (picked === null) {
        const n = Number(e.key);
        if (n >= 1 && n <= q.options.length) choose(n - 1);
      } else if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    recordAnswer(q.question, ok);
    onAnswer(ok);
  }

  if (finished) {
    const score = results.filter(Boolean).length;
    const missed = items.filter((_, i) => !results[i]);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="text-center">
          <div className="text-5xl font-semibold tabular-nums">
            {score}/{items.length}
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {score === items.length ? "Perfect round." : score / items.length >= 0.7 ? "Solid. Review the misses below." : "Worth revisiting the lessons below."}
          </p>
        </div>
        {missed.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Re-read</h3>
            <ul className="space-y-2">
              {missed.map((m) => (
                <li key={m.question} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p>{m.question}</p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-400">✓ {m.options[m.answer]}</p>
                  <Link href={`/tracks/${m.track}/${m.slug}`} className="mt-1 inline-block text-xs text-sky-700 underline dark:text-sky-400">
                    {m.lessonTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={onExit} className={buttonClass("brand", "lg", "mt-6 w-full")}>
          New round
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
        <button onClick={onExit} className="hover:underline">← Exit</button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(results.length / items.length) * 100}%` }} />
        </div>
        <span className="tabular-nums">
          {index + 1}/{items.length}
        </span>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <Link href={`/tracks/${q.track}/${q.slug}`} className="text-xs font-medium text-slate-500 hover:underline">
          {q.lessonTitle}
        </Link>
        <p className="mt-2 text-lg font-medium">{q.question}</p>
        <div className="mt-5 space-y-2">
          {q.options.map((opt, i) => {
            let tone = "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5";
            if (picked !== null && i === q.answer) tone = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10";
            else if (picked !== null && i === picked) tone = "border-rose-500 bg-rose-50 dark:bg-rose-500/10";
            else if (picked !== null) tone = "border-slate-200 opacity-60 dark:border-slate-700";
            return (
              <button
                key={opt}
                disabled={picked !== null}
                onClick={() => choose(i)}
                className={`flex w-full gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition ${tone}`}
              >
                <Kbd className="mt-px">{i + 1}</Kbd>
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-5 text-sm">
            <p className={picked === q.answer ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-semibold text-rose-700 dark:text-rose-400"}>
              {picked === q.answer ? "Correct." : "Not quite."}
            </p>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{q.explanation}</p>
            <button onClick={next} className={buttonClass("brand", "md", "mt-4")}>
              {results.length === items.length ? "See results" : "Next question"} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-24 shrink-0 text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
