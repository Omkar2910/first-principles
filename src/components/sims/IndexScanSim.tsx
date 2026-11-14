"use client";

import { useState } from "react";
import { SimFrame, Slider, Stat } from "./ui";

const FANOUT = 300; // keys per B-tree page (realistic for 8 KB pages and small keys)
const PAGE_READ_MS = 0.1; // page from cache/SSD, rough
const ROW_SCAN_NS = 50; // per row in a sequential scan, rough

export function IndexScanSim() {
  const [exp, setExp] = useState(6); // rows = 10^exp
  const [indexed, setIndexed] = useState(false);
  const rows = Math.round(10 ** exp);

  const depth = Math.max(1, Math.ceil(Math.log(rows) / Math.log(FANOUT)));
  const indexPages = depth + 1; // tree levels + heap fetch
  const scanMs = (rows * ROW_SCAN_NS) / 1e6;
  const indexMs = indexPages * PAGE_READ_MS;
  const ms = indexed ? indexMs : scanMs;

  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : v >= 1 ? `${v.toFixed(0)} ms` : `${v.toFixed(2)} ms`);

  // Level-by-level page counts for the tree picture.
  const levels = Array.from({ length: depth }, (_, i) => Math.min(FANOUT ** i, Math.ceil(rows / FANOUT)));

  return (
    <SimFrame title="Index vs full table scan" hint="Query: SELECT * FROM users WHERE email = 'ada@shop.com'. Grow the table and compare.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Table size (10^x rows)" value={exp} min={3} max={9} step={0.5} onChange={setExp} unit="" />
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" checked={indexed} onChange={(e) => setIndexed(e.target.checked)} />
          <code className="text-xs">CREATE INDEX ON users(email)</code>
        </label>
      </div>
      <p className="mt-1 text-xs text-ink-500">{rows.toLocaleString()} rows</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Rows examined" value={indexed ? "1" : rows.toLocaleString()} />
        <Stat label="Pages read" value={indexed ? indexPages : Math.ceil(rows / 100).toLocaleString()} />
        <Stat label="Approx. time" value={fmt(ms)} tone={ms > 100 ? "text-rose-600" : "text-emerald-600"} />
      </div>

      <div className="mt-5 rounded-lg bg-ink-50 p-4 dark:bg-ink-800/60">
        {indexed ? (
          <>
            <div className="mb-2 text-xs font-medium text-ink-500">B-tree path (fan-out ≈ {FANOUT}): one page per level</div>
            <div className="flex flex-col items-center gap-1.5">
              {levels.map((count, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-right text-ink-500">{i === 0 ? "root" : i === depth - 1 ? "leaf" : `level ${i}`}</span>
                  <span className="rounded border-2 border-emerald-500 bg-emerald-100 px-2 py-0.5 font-mono dark:bg-emerald-500/20">1 page read</span>
                  <span className="text-ink-400">of {count.toLocaleString()} page{count > 1 ? "s" : ""}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-right text-ink-500">heap</span>
                <span className="rounded border-2 border-sky-500 bg-sky-100 px-2 py-0.5 font-mono dark:bg-sky-500/20">fetch row</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-600 dark:text-ink-400">
              Depth grows with log(rows): a billion rows is still only ~{Math.ceil(9 / Math.log10(FANOUT))}–4 levels.
            </p>
          </>
        ) : (
          <>
            <div className="mb-2 text-xs font-medium text-ink-500">Sequential scan: read every page, check every row</div>
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: 120 }).map((_, i) => (
                <span key={i} className="h-3 w-3 rounded-sm bg-rose-400/70" />
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-600 dark:text-ink-400">Cost grows linearly: 10× the rows = 10× the time.</p>
          </>
        )}
      </div>
    </SimFrame>
  );
}
