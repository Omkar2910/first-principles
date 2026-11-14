"use client";

import { useState } from "react";
import { SimFrame, Stat } from "./ui";

function human(n: number, unit = "") {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)} T${unit}`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)} B${unit}`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)} M${unit}`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)} K${unit}`;
  return `${n.toFixed(n < 10 ? 1 : 0)}${unit ? " " + unit : ""}`;
}

function bytes(n: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

function Field({ label, value, onChange, step = 1, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          step={step}
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-md border border-ink-300 bg-white px-2 py-1 tabular-nums dark:border-ink-600 dark:bg-ink-800"
        />
        {suffix && <span className="shrink-0 text-xs text-ink-500">{suffix}</span>}
      </span>
    </label>
  );
}

const PRESETS = {
  "URL shortener": { dau: 100e6, reqs: 10, writePct: 1, size: 500, years: 5, peak: 3 },
  "Chat app": { dau: 500e6, reqs: 80, writePct: 50, size: 200, years: 5, peak: 3 },
  "Photo sharing": { dau: 200e6, reqs: 50, writePct: 2, size: 2_000_000, years: 10, peak: 2 },
  "Internal B2B tool": { dau: 20_000, reqs: 200, writePct: 20, size: 2_000, years: 3, peak: 4 },
};

export function EstimationCalculator() {
  const [dau, setDau] = useState(100e6);
  const [reqs, setReqs] = useState(10);
  const [writePct, setWritePct] = useState(1);
  const [size, setSize] = useState(500);
  const [years, setYears] = useState(5);
  const [peak, setPeak] = useState(3);

  const perDay = dau * reqs;
  const avgQps = perDay / 86_400;
  const peakQps = avgQps * peak;
  const writeQps = avgQps * (writePct / 100);
  const readQps = avgQps - writeQps;
  const storagePerDay = perDay * (writePct / 100) * size;
  const totalStorage = storagePerDay * 365 * years;
  const servers = Math.max(1, Math.ceil(peakQps / 1000));

  const apply = (p: (typeof PRESETS)[keyof typeof PRESETS]) => {
    setDau(p.dau); setReqs(p.reqs); setWritePct(p.writePct); setSize(p.size); setYears(p.years); setPeak(p.peak);
  };

  return (
    <SimFrame title="Back-of-envelope estimator" hint="Pick a preset or enter your own assumptions. The point is the order of magnitude, not precision.">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {Object.entries(PRESETS).map(([name, p]) => (
          <button key={name} onClick={() => apply(p)} className="rounded-md border border-ink-300 px-2 py-1 text-xs dark:border-ink-600">
            {name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Daily active users" value={dau} onChange={setDau} step={1000} />
        <Field label="Requests per user per day" value={reqs} onChange={setReqs} />
        <Field label="Writes (% of requests)" value={writePct} onChange={setWritePct} suffix="%" />
        <Field label="Bytes stored per write" value={size} onChange={setSize} step={100} suffix="bytes" />
        <Field label="Retention" value={years} onChange={setYears} suffix="years" />
        <Field label="Peak / average ratio" value={peak} onChange={setPeak} suffix="×" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Average QPS" value={human(avgQps)} />
        <Stat label="Peak QPS" value={human(peakQps)} tone="text-amber-600" />
        <Stat label="Read / write QPS" value={`${human(readQps)} / ${human(writeQps)}`} />
        <Stat label="New storage / day" value={bytes(storagePerDay)} />
        <Stat label={`Storage over ${years}y`} value={bytes(totalStorage)} tone="text-violet-600" />
        <Stat label="With 3× replication" value={bytes(totalStorage * 3)} />
        <Stat label="Requests / day" value={human(perDay)} />
        <Stat label="App servers @1k QPS each" value={`~${servers.toLocaleString()}`} />
      </div>

      <div className="mt-5 rounded-lg bg-ink-50 p-3 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-400">
        <b>Handy numbers:</b> 1 day ≈ 86,400 s ≈ 10⁵ s · 1M requests/day ≈ 12 QPS · 1B/day ≈ 12K QPS · 2³² ≈ 4.3B · 62⁷ ≈ 3.5T ·
        one app server ≈ 1–10K simple QPS · one Postgres primary ≈ 10K+ simple writes/s · Redis ≈ 100K+ ops/s per node
      </div>
    </SimFrame>
  );
}
