"use client";

import { useState } from "react";
import { Segmented, SimFrame, Slider, Stat } from "./ui";

type Model = "pool" | "eventloop" | "virtual";

const CORES = 4;

export function ThreadPoolSim() {
  const [model, setModel] = useState<Model>("pool");
  const [rps, setRps] = useState(1500);
  const [cpuMs, setCpuMs] = useState(5);
  const [ioMs, setIoMs] = useState(100);
  const [poolSize, setPoolSize] = useState(200);
  const [blocking, setBlocking] = useState(false);

  // Max sustainable throughput (requests/sec) for each concurrency model.
  const cpuCap = (CORES * 1000) / cpuMs;
  let cap: number;
  let memoryMb: number;
  let bottleneck: string;
  if (model === "pool") {
    const threadCap = (poolSize * 1000) / (cpuMs + ioMs);
    cap = Math.min(threadCap, cpuCap);
    bottleneck = threadCap < cpuCap ? `threads (all ${poolSize} busy waiting on I/O)` : "CPU";
    memoryMb = poolSize * 1; // ~1 MB stack per platform thread
  } else if (model === "eventloop") {
    cap = blocking ? (CORES * 1000) / (cpuMs + ioMs) : cpuCap;
    bottleneck = blocking ? "the event loop is blocked during I/O" : "CPU";
    memoryMb = 50;
  } else {
    cap = cpuCap;
    bottleneck = "CPU";
    const inFlight = Math.min(rps, cap) * ((cpuMs + ioMs) / 1000);
    memoryMb = Math.round(50 + inFlight * 0.01);
  }

  const util = Math.min(rps / cap, 1);
  const overloaded = rps > cap;
  const base = cpuMs + ioMs;
  // Light queueing approximation below saturation; unbounded growth above it.
  const latency = overloaded ? null : Math.round(base + (cpuMs * util) / Math.max(1 - util, 0.05));
  const queueAfter10s = overloaded ? Math.round((rps - cap) * 10) : 0;
  const latencyAfter10s = overloaded ? Math.round(base + (queueAfter10s / cap) * 1000) : null;

  return (
    <SimFrame
      title="Concurrency models"
      hint="A 4-core server. Each request does some CPU work and then waits on I/O (a DB call). Find the point where each model falls over."
    >
      <div className="mb-5">
        <Segmented
          value={model}
          onChange={setModel}
          options={[
            { value: "pool", label: "Thread pool (classic Spring MVC)" },
            { value: "eventloop", label: "Event loop (Node / WebFlux)" },
            { value: "virtual", label: "Virtual threads (Java 21+)" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Incoming load" value={rps} min={100} max={5000} step={100} unit=" req/s" onChange={setRps} />
        <Slider label="CPU work per request" value={cpuMs} min={1} max={20} unit=" ms" onChange={setCpuMs} />
        <Slider label="I/O wait per request (DB, APIs)" value={ioMs} min={0} max={500} step={10} unit=" ms" onChange={setIoMs} />
        {model === "pool" && <Slider label="Thread pool size" value={poolSize} min={10} max={1000} step={10} onChange={setPoolSize} />}
        {model === "eventloop" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
            Someone used a <b>blocking</b> DB driver in a handler
          </label>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Max throughput" value={`${Math.round(cap).toLocaleString()}/s`} />
        <Stat label="Utilization" value={`${Math.round(util * 100)}%`} tone={overloaded ? "text-rose-600" : ""} />
        <Stat
          label={overloaded ? "Latency after 10s" : "Typical latency"}
          value={overloaded ? `${(latencyAfter10s! / 1000).toFixed(1)} s` : `${latency} ms`}
          tone={overloaded ? "text-rose-600" : "text-emerald-600"}
        />
        <Stat label="Memory for concurrency" value={`~${memoryMb.toLocaleString()} MB`} />
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full transition-all ${overloaded ? "bg-rose-500" : util > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${util * 100}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-ink-700 dark:text-ink-300">
        {overloaded ? (
          <>
            <b className="text-rose-600">Overloaded.</b> Requests arrive faster than they finish, so the queue grows by{" "}
            {Math.round(rps - cap).toLocaleString()} every second ({queueAfter10s.toLocaleString()} waiting after 10s). Bottleneck:{" "}
            <b>{bottleneck}</b>.
          </>
        ) : (
          <>
            Healthy. Bottleneck if load keeps rising: <b>{bottleneck}</b>.
          </>
        )}
      </p>
    </SimFrame>
  );
}
