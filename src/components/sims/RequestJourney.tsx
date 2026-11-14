"use client";

import { useEffect, useMemo, useState } from "react";

type NodeId = "browser" | "dns" | "lb" | "app" | "db";

type Step = {
  id: string;
  label: string;
  detail: string;
  from: NodeId;
  to: NodeId;
  ms: number;
  skipped?: string;
  color: string;
};

const NODES: { id: NodeId; label: string; sub: string; x: number }[] = [
  { id: "browser", label: "Browser", sub: "your laptop", x: 60 },
  { id: "dns", label: "DNS", sub: "resolver", x: 200 },
  { id: "lb", label: "Load balancer", sub: "edge", x: 340 },
  { id: "app", label: "App server", sub: "Spring / Node", x: 480 },
  { id: "db", label: "Database", sub: "Postgres", x: 620 },
];

const RTT_PRESETS = [
  { label: "Same city", rtt: 10 },
  { label: "Same country", rtt: 40 },
  { label: "Other continent", rtt: 180 },
];

export function RequestJourney() {
  const [rtt, setRtt] = useState(40);
  const [dnsCached, setDnsCached] = useState(false);
  const [connReused, setConnReused] = useState(false);
  const [dbMs, setDbMs] = useState(25);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const steps: Step[] = useMemo(() => {
    const s: Step[] = [
      {
        id: "dns",
        label: "DNS lookup",
        detail:
          "Browser asks: what IP is api.shop.com? The resolver walks root → .com → shop.com's nameserver, then caches the answer for its TTL.",
        from: "browser",
        to: "dns",
        ms: dnsCached ? 0 : rtt + 30,
        skipped: dnsCached ? "Answer was in the browser/OS cache" : undefined,
        color: "#0ea5e9",
      },
      {
        id: "tcp",
        label: "TCP handshake",
        detail: "SYN → SYN-ACK → ACK. One full round trip before a single byte of your request can be sent.",
        from: "browser",
        to: "lb",
        ms: connReused ? 0 : rtt,
        skipped: connReused ? "Reusing a kept-alive connection" : undefined,
        color: "#8b5cf6",
      },
      {
        id: "tls",
        label: "TLS handshake",
        detail: "Agree on keys and verify the server's certificate. TLS 1.3 needs one more round trip (TLS 1.2 needed two).",
        from: "browser",
        to: "lb",
        ms: connReused ? 0 : rtt,
        skipped: connReused ? "Session already encrypted" : undefined,
        color: "#a855f7",
      },
      {
        id: "req",
        label: "HTTP request",
        detail: "GET /products/42 travels to the load balancer, which picks a healthy app server and forwards it.",
        from: "browser",
        to: "app",
        ms: Math.round(rtt / 2) + 2,
        color: "#f59e0b",
      },
      {
        id: "db",
        label: "Business logic + DB query",
        detail: "The app validates the request, runs the handler, and queries the database. Usually the part you control most.",
        from: "app",
        to: "db",
        ms: dbMs + 5,
        color: "#10b981",
      },
      {
        id: "res",
        label: "HTTP response",
        detail: "200 OK + JSON travels back. The browser parses it and renders.",
        from: "app",
        to: "browser",
        ms: Math.round(rtt / 2) + 3,
        color: "#f43f5e",
      },
    ];
    return s;
  }, [rtt, dnsCached, connReused, dbMs]);

  const total = steps.reduce((a, s) => a + s.ms, 0);
  const network = steps.filter((s) => s.id !== "db").reduce((a, s) => a + s.ms, 0);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(
      () => (active >= steps.length - 1 ? setPlaying(false) : setActive((a) => a + 1)),
      active === -1 ? 100 : 1400,
    );
    return () => clearTimeout(t);
  }, [playing, active, steps.length]);

  const current = active >= 0 ? steps[active] : null;
  const nodeX = (id: NodeId) => NODES.find((n) => n.id === id)!.x;

  let offset = 0;

  return (
    <section className="not-prose my-8 rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Interactive · Request journey</div>
      <p className="mb-4 text-sm text-ink-600 dark:text-ink-400">
        Press play to follow one request. Then change the toggles and watch where the time goes.
      </p>

      {/* Topology */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 130" className="min-w-[560px] w-full" role="img" aria-label="Request path diagram">
          {NODES.slice(0, -1).map((n, i) => (
            <line key={n.id} x1={n.x} y1={50} x2={NODES[i + 1].x} y2={50} className="stroke-ink-300 dark:stroke-ink-700" strokeWidth={2} strokeDasharray="4 4" />
          ))}
          {current && current.ms > 0 && (
            <line
              key={current.id + active}
              x1={nodeX(current.from)}
              y1={50}
              x2={nodeX(current.to)}
              y2={50}
              stroke={current.color}
              strokeWidth={5}
              strokeLinecap="round"
              className="animate-[pulse_1.2s_ease-in-out_infinite]"
            />
          )}
          {NODES.map((n) => {
            const on = current && (current.from === n.id || current.to === n.id) && current.ms > 0;
            return (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={50}
                  r={22}
                  className={on ? "" : "fill-white stroke-ink-300 dark:fill-ink-900 dark:stroke-ink-600"}
                  fill={on ? current!.color : undefined}
                  stroke={on ? current!.color : undefined}
                  strokeWidth={2}
                />
                <text x={n.x} y={92} textAnchor="middle" className="fill-ink-800 text-[12px] font-semibold dark:fill-ink-100">
                  {n.label}
                </text>
                <text x={n.x} y={108} textAnchor="middle" className="fill-ink-500 text-[10px]">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Current step narration */}
      <div className="my-4 min-h-[72px] rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
        {current ? (
          <>
            <div className="font-semibold" style={{ color: current.color }}>
              Step {active + 1}/{steps.length} · {current.label} · {current.ms} ms
            </div>
            <div className="mt-1 text-ink-700 dark:text-ink-300">{current.skipped ? `Skipped: ${current.skipped}.` : current.detail}</div>
          </>
        ) : (
          <div className="text-ink-500">Ready. A user in another city opens your product page…</div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActive(-1);
            setPlaying(true);
          }}
          className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-ink-900"
        >
          ▶ Play
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setActive((a) => Math.min(a + 1, steps.length - 1));
          }}
          className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm dark:border-ink-600"
        >
          Step →
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setActive(-1);
          }}
          className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm dark:border-ink-600"
        >
          Reset
        </button>
      </div>

      {/* Controls */}
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <div className="mb-1.5 font-medium">User distance (round-trip time)</div>
          <div className="flex flex-wrap gap-1.5">
            {RTT_PRESETS.map((p) => (
              <button
                key={p.rtt}
                onClick={() => setRtt(p.rtt)}
                className={`rounded-md border px-2 py-1 text-xs ${rtt === p.rtt ? "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900" : "border-ink-300 dark:border-ink-600"}`}
              >
                {p.label} · {p.rtt}ms
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-medium">
            DB query time: <span className="tabular-nums">{dbMs} ms</span>
          </label>
          <input type="range" min={1} max={300} value={dbMs} onChange={(e) => setDbMs(+e.target.value)} className="w-full" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={dnsCached} onChange={(e) => setDnsCached(e.target.checked)} />
          DNS answer already cached
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={connReused} onChange={(e) => setConnReused(e.target.checked)} />
          Reuse existing connection (keep-alive)
        </label>
      </div>

      {/* Waterfall */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium">Where the time went</span>
          <span className="tabular-nums">
            Total <b>{total} ms</b> · network {Math.round((network / total) * 100)}%
          </span>
        </div>
        <div className="space-y-1.5">
          {steps.map((s, i) => {
            const left = (offset / total) * 100;
            const width = (s.ms / total) * 100;
            offset += s.ms;
            return (
              <div key={s.id} className="flex items-center gap-3 text-xs">
                <div className={`w-44 shrink-0 truncate ${i === active ? "font-semibold" : "text-ink-600 dark:text-ink-400"}`}>{s.label}</div>
                <div className="relative h-4 flex-1 rounded bg-ink-100 dark:bg-ink-800">
                  {s.ms > 0 && (
                    <div className="absolute h-4 rounded transition-all duration-500" style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%`, background: s.color }} />
                  )}
                </div>
                <div className="w-14 shrink-0 text-right tabular-nums">{s.ms ? `${s.ms} ms` : "skip"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
