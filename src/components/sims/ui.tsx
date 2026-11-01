"use client";

import type { ReactNode } from "react";

/** Shared chrome for interactive simulators so they look consistent. */
export function SimFrame({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-none">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/80">
        <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">Interactive</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-5">
        {hint && <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-slate-600 dark:text-slate-400">
          {value.toLocaleString()}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-brand-600" />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            value === o.value
              ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
              : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, tone = "" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

export function Button({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          : "rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600"
      }
    >
      {children}
    </button>
  );
}
