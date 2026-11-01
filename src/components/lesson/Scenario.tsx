"use client";

import { useState } from "react";

type Choice = { text: string; feedback: string; best?: boolean };

/** A workplace situation with several responses; each response explains how it plays out. */
export function Scenario({ situation, choices }: { situation: string; choices: Choice[] }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <section className="not-prose my-8 rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50/70 to-white p-5 sm:p-6 dark:border-brand-500/25 dark:from-brand-500/[0.07] dark:to-transparent">
      <div className="mb-2 text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-300">
        Scenario · what would you do?
      </div>
      <p className="mb-4 leading-relaxed text-pretty">{situation}</p>
      <div className="space-y-2">
        {choices.map((c, i) => {
          const shown = picked !== null;
          let tone = "border-slate-200 bg-white hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500/50";
          if (shown && c.best) tone = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10";
          else if (shown && i === picked) tone = "border-amber-500 bg-amber-50 dark:bg-amber-500/10";
          return (
            <button
              key={c.text}
              onClick={() => setPicked(i)}
              className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${tone}`}
            >
              <span className="font-medium">{c.text}</span>
              {shown && (i === picked || c.best) && (
                <span className="mt-1.5 block text-slate-700 dark:text-slate-300">
                  {c.best ? "✓ Strongest move. " : ""}
                  {c.feedback}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button onClick={() => setPicked(null)} className="mt-3 text-xs text-slate-500 underline">
          Reset
        </button>
      )}
    </section>
  );
}
