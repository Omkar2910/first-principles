"use client";

import { useState } from "react";
import { SimFrame } from "./ui";

const OPS: { op: string; ns: number }[] = [
  { op: "L1 cache reference", ns: 1 },
  { op: "Branch mispredict", ns: 3 },
  { op: "L2 cache reference", ns: 4 },
  { op: "Mutex lock/unlock", ns: 17 },
  { op: "Main memory (RAM) reference", ns: 100 },
  { op: "Compress 1 KB (fast codec)", ns: 2_000 },
  { op: "Read 1 MB sequentially from RAM", ns: 10_000 },
  { op: "Random read from NVMe SSD", ns: 20_000 },
  { op: "Round trip within same datacenter", ns: 500_000 },
  { op: "Read 1 MB sequentially from SSD", ns: 1_000_000 },
  { op: "Typical indexed DB query (same DC)", ns: 2_000_000 },
  { op: "Disk (HDD) seek", ns: 5_000_000 },
  { op: "Round trip US East ↔ US West", ns: 70_000_000 },
  { op: "Round trip US ↔ Europe", ns: 150_000_000 },
];

function fmtReal(ns: number) {
  if (ns < 1_000) return `${ns} ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toLocaleString()} µs`;
  return `${(ns / 1_000_000).toLocaleString()} ms`;
}

function fmtHuman(ns: number) {
  // 1 ns → 1 second
  const s = ns;
  if (s < 60) return `${s} seconds`;
  if (s < 3600) return `${Math.round(s / 60)} minutes`;
  if (s < 86400) return `${Math.round(s / 3600)} hours`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} days`;
  if (s < 86400 * 365) return `${Math.round(s / (86400 * 30))} months`;
  return `${(s / (86400 * 365)).toFixed(1)} years`;
}

export function LatencyScale() {
  const [human, setHuman] = useState(false);
  const max = Math.log10(OPS[OPS.length - 1].ns);
  return (
    <SimFrame title="Latency numbers" hint="Bars are on a log scale; each gridline is 10× slower. Flip to human scale to feel the gaps.">
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} />
        Human scale: pretend 1 nanosecond = 1 second
      </label>
      <div className="space-y-1.5">
        {OPS.map((o) => {
          const w = ((Math.log10(o.ns) + 0.3) / (max + 0.3)) * 100;
          const tier = o.ns < 200 ? "bg-emerald-500" : o.ns < 100_000 ? "bg-sky-500" : o.ns < 10_000_000 ? "bg-amber-500" : "bg-rose-500";
          return (
            <div key={o.op} className="flex items-center gap-3 text-xs">
              <div className="w-48 shrink-0 truncate text-slate-700 dark:text-slate-300 sm:w-60">{o.op}</div>
              <div className="relative h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800">
                <div className={`h-4 rounded ${tier}`} style={{ width: `${w}%` }} />
              </div>
              <div className="w-24 shrink-0 text-right tabular-nums">{human ? fmtHuman(o.ns) : fmtReal(o.ns)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />CPU</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Memory / local SSD</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Network in DC / disk</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Cross-region network</span>
      </div>
    </SimFrame>
  );
}
