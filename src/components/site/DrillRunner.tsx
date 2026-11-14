"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Drill, Phase } from "@/lib/drills";
import { recordDrill, saveDrillNotes, useDrillAttempts, useDrillNotes } from "@/lib/interviewState";
import { Badge, Button, Card, Eyebrow, ProgressBar } from "@/components/ui";

type Stage = "brief" | "running" | "grading" | "done";

const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** Elapsed seconds while `running`, ticking once a second. */
function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const started = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    started.current = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - started.current!) / 1000)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume from the current value only when toggled
  }, [running]);
  return [elapsed, setElapsed] as const;
}

export function DrillRunner({ drill, phases, lessonTitles }: { drill: Drill; phases: Phase[]; lessonTitles: Record<string, string> }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useStopwatch(stage === "running" && !paused);
  const [showHints, setShowHints] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => drill.rubric.map(() => false));
  const notes = useDrillNotes()[drill.id] ?? "";
  const attempts = useDrillAttempts()[drill.id] ?? [];

  const total = phases.reduce((a, p) => a + p.minutes * 60, 0);
  let acc = 0;
  const phaseIndex = Math.max(0, phases.findIndex((p) => (acc += p.minutes * 60) > elapsed));
  const phaseEnd = phases.slice(0, phaseIndex + 1).reduce((a, p) => a + p.minutes * 60, 0);
  const overtime = elapsed > total;

  const finish = () => setStage("grading");
  const submit = () => {
    recordDrill(drill.id, { at: Date.now(), checked: checked.filter(Boolean).length, total: checked.length, minutes: Math.round(elapsed / 60) });
    setStage("done");
  };
  const restart = () => {
    setElapsed(0);
    setChecked(drill.rubric.map(() => false));
    setPaused(false);
    setStage("brief");
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <Eyebrow>The prompt</Eyebrow>
        <p className="font-display mt-2 text-xl leading-snug font-semibold text-balance">{drill.prompt}</p>
        <button onClick={() => setShowHints((s) => !s)} className="mt-4 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
          {showHints ? "Hide" : "Show"} what the interviewer says if you ask
        </button>
        {showHints && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600 dark:text-ink-400">
            {drill.clarifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </Card>

      {stage === "brief" && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">How this works</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-600 dark:text-ink-400">
            <li>Start the {Math.round(total / 60)}-minute timer. Talk through your design out loud, as if an interviewer were listening.</li>
            <li>The timer walks you through each step and nudges you when it&apos;s time to move on.</li>
            <li>Sketch on paper or a whiteboard tool; type key decisions in the notes box (saved in this browser).</li>
            <li>When you finish, check off what you covered. Anything you missed links to the lesson that teaches it.</li>
          </ol>
          <Button variant="brand" size="lg" className="mt-5" onClick={() => setStage("running")}>
            Start {Math.round(total / 60)}-minute drill
          </Button>
          {attempts.length > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              Previous attempts:{" "}
              {attempts
                .slice(-5)
                .map((a) => `${a.checked}/${a.total}`)
                .join(" · ")}
            </p>
          )}
        </Card>
      )}

      {stage === "running" && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 border-b border-ink-200 p-5 dark:border-ink-800">
            <div className={`font-display text-4xl font-bold tabular-nums ${overtime ? "text-rose-600" : ""}`}>{fmt(elapsed)}</div>
            <div className="text-sm text-ink-500">of {fmt(total)}</div>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPaused((p) => !p)}>
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button variant="brand" size="sm" onClick={finish}>
                I&apos;m done → grade it
              </Button>
            </div>
          </div>
          <ProgressBar value={Math.min(100, (elapsed / total) * 100)} className="rounded-none" />
          <ol className="divide-y divide-ink-100 dark:divide-ink-800">
            {phases.map((p, i) => {
              const state = overtime || i < phaseIndex ? "past" : i === phaseIndex ? "now" : "next";
              return (
                <li key={p.name} className={`flex gap-4 px-5 py-3 text-sm ${state === "now" ? "bg-brand-50/70 dark:bg-brand-500/10" : ""}`}>
                  <span className={`w-14 shrink-0 font-mono text-xs ${state === "now" ? "text-brand-700 dark:text-brand-300" : "text-ink-400"}`}>{p.minutes} min</span>
                  <div className={state === "past" ? "text-ink-400 line-through" : ""}>
                    <div className="font-medium">{p.name}</div>
                    {state === "now" && (
                      <div className="mt-0.5 text-ink-600 dark:text-ink-400">
                        {p.prompt} <span className="text-ink-400">· move on at {fmt(phaseEnd)}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {overtime && <p className="border-t border-ink-200 px-5 py-3 text-sm text-rose-600 dark:border-ink-800">Time&apos;s up. In a real interview, wrap up with a summary of trade-offs and what you&apos;d do next.</p>}
        </Card>
      )}

      {(stage === "running" || stage === "grading") && (
        <label className="block">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => saveDrillNotes(drill.id, e.target.value)}
            rows={8}
            placeholder="Requirements, numbers, API, data model, components, trade-offs…"
            className="mt-1.5 w-full rounded-xl border border-ink-300 bg-white p-3 font-mono text-sm dark:border-ink-700 dark:bg-ink-900"
          />
        </label>
      )}

      {stage === "grading" && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">What did you cover?</h2>
          <p className="mt-1 text-sm text-ink-500">Be honest: only tick what you said clearly enough for an interviewer to notice.</p>
          <ul className="mt-4 space-y-2">
            {drill.rubric.map((r, i) => (
              <li key={r.text}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={(e) => setChecked((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="mt-1 accent-brand-600"
                  />
                  <span className="text-sm">{r.text}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button variant="brand" className="mt-4" onClick={submit}>
            Save result
          </Button>
        </Card>
      )}

      {stage === "done" && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold">
              {checked.filter(Boolean).length}/{checked.length}
            </span>
            <span className="text-sm text-ink-500">covered in {Math.round(elapsed / 60)} min</span>
          </div>
          {checked.some((c) => !c) ? (
            <>
              <h2 className="mt-5 text-lg font-bold">Study these next</h2>
              <ul className="mt-2 space-y-2">
                {drill.rubric
                  .filter((_, i) => !checked[i])
                  .map((r) => {
                    const [t, s] = r.lesson.split("/");
                    return (
                      <li key={r.text} className="flex flex-col gap-1 rounded-lg border border-ink-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-ink-800">
                        <span>{r.text}</span>
                        <Link href={`/tracks/${t}/${s}`} className="shrink-0 font-medium text-brand-700 hover:underline dark:text-brand-400">
                          {lessonTitles[r.lesson]} →
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </>
          ) : (
            <p className="mt-3">
              <Badge tone="emerald">Full marks</Badge> Try it again in a week, faster, or move to a harder drill.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={restart}>
              Try again
            </Button>
            <Link href={`/tracks/${drill.lesson}`} className="inline-flex h-9 items-center px-2 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
              Read the full case study →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
