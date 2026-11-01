"use client";

import { useRef, useState } from "react";
import { recordAnswer } from "@/lib/quizStats";

type Props = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export function Quiz({ question, options, answer, explanation }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  // Only the first attempt counts towards stats; "try again" is practice.
  const recorded = useRef(false);

  const pick = (i: number) => {
    setPicked(i);
    if (!recorded.current) {
      recorded.current = true;
      recordAnswer(question, i === answer);
    }
  };

  return (
    <section className="not-prose my-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-none">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-100 text-[11px] dark:bg-brand-500/15" aria-hidden>
          ?
        </span>
        Check yourself
      </div>
      <p className="mb-4 font-medium text-pretty">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          let tone = "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5";
          let letter = "border-slate-300 text-slate-500 dark:border-slate-600";
          if (done && i === answer) {
            tone = "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10";
            letter = "border-emerald-500 bg-emerald-500 text-white";
          } else if (done && i === picked) {
            tone = "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10";
            letter = "border-rose-500 bg-rose-500 text-white";
          } else if (done) tone = "border-slate-200 opacity-50 dark:border-slate-800";
          return (
            <button
              key={opt}
              disabled={done}
              onClick={() => pick(i)}
              className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition ${tone}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${letter}`}>
                {done && i === answer ? "✓" : done && i === picked ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span className="pt-px">{opt}</span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${picked === answer ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10"}`}>
          <p className={picked === answer ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-semibold text-rose-700 dark:text-rose-300"}>
            {picked === answer ? "Correct." : "Not quite."}
          </p>
          <p className="mt-1 text-slate-700 dark:text-slate-300">{explanation}</p>
          <button onClick={() => setPicked(null)} className="mt-3 text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white">
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
