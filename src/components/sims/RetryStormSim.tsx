"use client";

import { useMemo, useState } from "react";
import { Segmented, SimFrame, Slider, Stat } from "./ui";

type Backoff = "fixed" | "exp" | "jitter";

const CLIENTS = 200;
const BUCKETS = 32; // 0.5s buckets over 16s

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function RetryStormSim() {
  const [layers, setLayers] = useState(3);
  const [retries, setRetries] = useState(3);
  const [backoff, setBackoff] = useState<Backoff>("exp");

  const everyLayer = (retries + 1) ** layers;
  const topOnly = retries + 1;

  const histogram = useMemo(() => {
    const rnd = seeded(42);
    const h = Array(BUCKETS).fill(0);
    for (let c = 0; c < CLIENTS; c++) {
      let t = 0;
      for (let attempt = 1; attempt <= 5; attempt++) {
        let delay: number;
        if (backoff === "fixed") delay = 1;
        else if (backoff === "exp") delay = 0.5 * 2 ** (attempt - 1);
        else delay = rnd() * 0.5 * 2 ** (attempt - 1) * 2; // full jitter
        t += delay;
        const b = Math.floor(t / 0.5);
        if (b < BUCKETS) h[b]++;
      }
    }
    return h;
  }, [backoff]);
  const peak = Math.max(...histogram);

  return (
    <SimFrame title="Retry storms" hint="A dependency at the bottom of a call chain is failing. See how retries multiply load, and how backoff timing shapes the spikes.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Layers in the call chain" value={layers} min={1} max={5} onChange={setLayers} />
        <Slider label="Retries per layer" value={retries} min={0} max={4} onChange={setRetries} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Every layer retries" value={`${everyLayer}×`} tone={everyLayer > 20 ? "text-rose-600" : ""} />
        <Stat label="Only the top layer retries" value={`${topOnly}×`} tone="text-emerald-600" />
        <Stat label="With a 10% retry budget" value={`≤${(1.1 ** layers).toFixed(2)}×`} tone="text-emerald-600" />
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Calls hitting the failing service per user request. A struggling service getting {everyLayer}× its normal traffic will never recover.
      </p>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">When do {CLIENTS} clients that failed at t=0 retry?</span>
          <Segmented value={backoff} onChange={setBackoff} options={[{ value: "fixed", label: "Fixed 1s" }, { value: "exp", label: "Exponential" }, { value: "jitter", label: "Exponential + jitter" }]} />
        </div>
        <div className="flex h-32 items-end gap-0.5 rounded-lg bg-ink-50 p-2 dark:bg-ink-800/60">
          {histogram.map((v, i) => (
            <div key={i} className="flex-1 rounded-t bg-sky-500 transition-all" style={{ height: `${(v / peak) * 100}%` }} title={`${(i * 0.5).toFixed(1)}s: ${v} retries`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-ink-500"><span>0s</span><span>8s</span><span>16s</span></div>
        <p className="mt-2 text-xs text-ink-600 dark:text-ink-400">
          {backoff === "jitter"
            ? "Jitter spreads retries out, so the recovering service sees a gentle trickle instead of synchronized waves."
            : "Without jitter, every client retries at the same instant: synchronized spikes that knock a recovering service over again."}
        </p>
      </div>
    </SimFrame>
  );
}
