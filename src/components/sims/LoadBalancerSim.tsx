"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Segmented, SimFrame, Slider, Stat } from "./ui";

type Algo = "rr" | "random" | "least";
type Server = { name: string; cap: number; queue: number; alive: boolean; served: number };

const INITIAL: Server[] = [
  { name: "app-1", cap: 3, queue: 0, alive: true, served: 0 },
  { name: "app-2", cap: 3, queue: 0, alive: true, served: 0 },
  { name: "app-3", cap: 3, queue: 0, alive: true, served: 0 },
  { name: "app-4 (old VM)", cap: 1, queue: 0, alive: true, served: 0 },
];
const MAX_QUEUE = 25;

export function LoadBalancerSim() {
  const [algo, setAlgo] = useState<Algo>("rr");
  const [rate, setRate] = useState(8);
  const [health, setHealth] = useState(true);
  const [running, setRunning] = useState(false);
  const [servers, setServers] = useState<Server[]>(INITIAL);
  const [stats, setStats] = useState({ ok: 0, failed: 0 });
  const rr = useRef(0);

  const serversRef = useRef(servers);
  useEffect(() => {
    serversRef.current = servers;
  }, [servers]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const s = serversRef.current.map((x) => ({ ...x }));
      let failed = 0;
      const pool = s.map((_, i) => i).filter((i) => !health || s[i].alive);
      for (let r = 0; r < rate; r++) {
        if (pool.length === 0) { failed++; continue; }
        let idx: number;
        if (algo === "rr") idx = pool[rr.current++ % pool.length];
        else if (algo === "random") idx = pool[Math.floor(Math.random() * pool.length)];
        else idx = pool.reduce((best, i) => (s[i].queue / s[i].cap < s[best].queue / s[best].cap ? i : best), pool[0]);
        if (!s[idx].alive || s[idx].queue >= MAX_QUEUE) failed++;
        else s[idx].queue++;
      }
      let ok = 0;
      for (const x of s) {
        if (!x.alive) continue;
        const done = Math.min(x.queue, x.cap);
        x.queue -= done;
        x.served += done;
        ok += done;
      }
      serversRef.current = s;
      setServers(s);
      setStats((st) => ({ ok: st.ok + ok, failed: st.failed + failed }));
    }, 300);
    return () => clearInterval(t);
  }, [running, algo, rate, health]);

  const totalCap = servers.filter((s) => s.alive).reduce((a, s) => a + s.cap, 0);
  const errRate = stats.ok + stats.failed ? (stats.failed / (stats.ok + stats.failed)) * 100 : 0;

  return (
    <SimFrame title="Load balancer" hint="Four servers; app-4 is a third as powerful. Run traffic, switch algorithms, then kill a server with and without health checks.">
      <div className="space-y-3">
        <Segmented value={algo} onChange={setAlgo} options={[{ value: "rr", label: "Round robin" }, { value: "random", label: "Random" }, { value: "least", label: "Least outstanding requests" }]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Incoming requests per tick" value={rate} min={1} max={14} onChange={setRate} />
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={health} onChange={(e) => setHealth(e.target.checked)} /> Health checks enabled
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button primary onClick={() => setRunning((r) => !r)}>{running ? "❚❚ Pause" : "▶ Run traffic"}</Button>
          <Button onClick={() => { setServers(INITIAL); setStats({ ok: 0, failed: 0 }); }}>Reset</Button>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {servers.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setServers((prev) => prev.map((x, j) => (j === i ? { ...x, alive: !x.alive, queue: 0 } : x)))}
              className={`w-32 shrink-0 rounded-md border px-2 py-1 text-left ${s.alive ? "border-ink-300 dark:border-ink-600" : "border-rose-500 bg-rose-50 text-rose-700 line-through dark:bg-rose-500/10"}`}
              title="Click to kill / revive"
            >
              {s.alive ? "🟢" : "💀"} {s.name}
            </button>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-ink-100 dark:bg-ink-800">
              <div
                className={`h-full transition-all ${s.queue > 15 ? "bg-rose-500" : s.queue > 6 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${(s.queue / MAX_QUEUE) * 100}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right tabular-nums">queue {s.queue} · cap {s.cap}</span>
          </div>
        ))}
        <p className="text-[11px] text-ink-500">Click a server name to kill or revive it. A full queue ({MAX_QUEUE}) rejects requests.</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Served" value={stats.ok.toLocaleString()} />
        <Stat label="Failed" value={stats.failed.toLocaleString()} tone={stats.failed ? "text-rose-600" : ""} />
        <Stat label="Error rate · capacity" value={`${errRate.toFixed(1)}% · ${totalCap}/tick`} tone={errRate > 1 ? "text-rose-600" : "text-emerald-600"} />
      </div>
    </SimFrame>
  );
}
