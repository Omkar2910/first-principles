"use client";

import { useState } from "react";
import { Button, SimFrame, Slider, Stat } from "./ui";

const KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];
// Skewed popularity: A is hot, H is rare (roughly Zipfian).
const WEIGHTS = [30, 18, 12, 9, 7, 5, 4, 3];

function skewedKey() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < KEYS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return KEYS[i];
  }
  return KEYS[0];
}

export function LruCacheSim() {
  const [cap, setCap] = useState(3);
  const [cache, setCache] = useState<string[]>([]); // index 0 = most recently used
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [last, setLast] = useState<{ key: string; hit: boolean; evicted?: string } | null>(null);

  const access = (key: string, state = { cache, hits, misses }) => {
    const c = [...state.cache];
    const i = c.indexOf(key);
    let evicted: string | undefined;
    const hit = i !== -1;
    if (hit) c.splice(i, 1);
    else if (c.length >= cap) evicted = c.pop();
    c.unshift(key);
    return { cache: c, hits: state.hits + (hit ? 1 : 0), misses: state.misses + (hit ? 0 : 1), last: { key, hit, evicted } };
  };

  const click = (key: string) => {
    const r = access(key);
    setCache(r.cache); setHits(r.hits); setMisses(r.misses); setLast(r.last);
  };

  const runMany = () => {
    let s = { cache, hits, misses };
    let l = last;
    for (let i = 0; i < 200; i++) {
      const r = access(skewedKey(), s);
      s = { cache: r.cache, hits: r.hits, misses: r.misses };
      l = r.last;
    }
    setCache(s.cache); setHits(s.hits); setMisses(s.misses); setLast(l);
  };

  const reset = () => { setCache([]); setHits(0); setMisses(0); setLast(null); };
  const total = hits + misses;

  return (
    <SimFrame title="LRU cache" hint="Click keys to read them through the cache. Misses go to the 'database' and get cached; when full, the least recently used key is evicted.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Cache capacity" value={cap} min={1} max={7} onChange={(v) => { setCap(v); reset(); }} />
        <div className="flex flex-wrap items-end gap-2">
          <Button primary onClick={runMany}>Simulate 200 skewed reads</Button>
          <Button onClick={reset}>Reset</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {KEYS.map((k, i) => (
          <button key={k} onClick={() => click(k)} className="rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm hover:border-slate-500 dark:border-slate-600">
            GET {k}
            <span className="ml-1 text-[10px] text-slate-400">{WEIGHTS[i]}%</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>Most recent →</span>
          <span>→ evicted next</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: cap }).map((_, i) => {
            const k = cache[i];
            const isNew = last && k === last.key && i === 0;
            return (
              <div
                key={i}
                className={`flex h-14 flex-1 items-center justify-center rounded-lg border-2 font-mono text-lg font-semibold transition ${
                  k ? (isNew ? (last!.hit ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-amber-500 bg-amber-50 dark:bg-amber-500/10") : "border-slate-300 dark:border-slate-600") : "border-dashed border-slate-200 text-slate-300 dark:border-slate-700"
                }`}
              >
                {k ?? "·"}
              </div>
            );
          })}
        </div>
        <p className="mt-2 min-h-5 text-sm">
          {last && (last.hit ? (
            <span className="text-emerald-700 dark:text-emerald-400">Hit: {last.key} served from memory (~0.1 ms) and moved to front.</span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">
              Miss: {last.key} loaded from DB (~5 ms){last.evicted ? `, evicting ${last.evicted}` : ""}.
            </span>
          ))}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Hits" value={hits} />
        <Stat label="Misses" value={misses} />
        <Stat label="Hit rate" value={total ? `${Math.round((hits / total) * 100)}%` : "-"} tone="text-emerald-600" />
      </div>
      <p className="mt-2 text-xs text-slate-500">Try capacity 2 vs 4 with the skewed simulation. A small cache of the hottest keys captures most reads.</p>
    </SimFrame>
  );
}
