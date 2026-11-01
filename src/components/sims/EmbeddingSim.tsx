"use client";

import { useState } from "react";
import { Segmented, SimFrame } from "./ui";

// Hand-placed 2D "embeddings": real models use hundreds/thousands of dimensions,
// but the idea (similar meaning → nearby vectors) is the same.
const DOCS = [
  { text: "How do I get a refund for my order?", x: 0.82, y: 0.78, topic: "billing" },
  { text: "Money back policy for returned items", x: 0.86, y: 0.7, topic: "billing" },
  { text: "My card was charged twice", x: 0.74, y: 0.86, topic: "billing" },
  { text: "Update payment method on file", x: 0.68, y: 0.72, topic: "billing" },
  { text: "Where is my package?", x: 0.2, y: 0.8, topic: "shipping" },
  { text: "Track shipment delivery status", x: 0.26, y: 0.86, topic: "shipping" },
  { text: "Parcel arrived damaged", x: 0.32, y: 0.7, topic: "shipping" },
  { text: "Change delivery address", x: 0.16, y: 0.68, topic: "shipping" },
  { text: "Reset my password", x: 0.22, y: 0.2, topic: "account" },
  { text: "Can't log in to my account", x: 0.3, y: 0.26, topic: "account" },
  { text: "Enable two-factor authentication", x: 0.14, y: 0.3, topic: "account" },
  { text: "Delete my profile and data", x: 0.34, y: 0.14, topic: "account" },
  { text: "App crashes on startup", x: 0.78, y: 0.2, topic: "tech" },
  { text: "Page loads very slowly", x: 0.86, y: 0.28, topic: "tech" },
  { text: "Error 500 when checking out", x: 0.7, y: 0.32, topic: "tech" },
  { text: "Notifications not arriving", x: 0.84, y: 0.12, topic: "tech" },
];

const QUERIES = [
  { text: "I want my money back", x: 0.84, y: 0.75 },
  { text: "where's my stuff??", x: 0.23, y: 0.78 },
  { text: "forgot login credentials", x: 0.25, y: 0.22 },
  { text: "website is broken during payment", x: 0.73, y: 0.45 },
];

const COLORS: Record<string, string> = { billing: "#f59e0b", shipping: "#0ea5e9", account: "#8b5cf6", tech: "#f43f5e" };

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter((w) => w.length > 2));

export function EmbeddingSim() {
  const [qi, setQi] = useState(0);
  const [mode, setMode] = useState<"semantic" | "keyword">("semantic");
  const q = QUERIES[qi];

  const ranked = DOCS.map((d) => {
    const dist = Math.hypot(d.x - q.x, d.y - q.y);
    const qWords = words(q.text);
    const overlap = [...words(d.text)].filter((w) => qWords.has(w)).length;
    return { ...d, sim: Math.max(0, 1 - dist / 0.9), overlap };
  });
  const top =
    mode === "semantic"
      ? [...ranked].sort((a, b) => b.sim - a.sim).slice(0, 3)
      : [...ranked].filter((d) => d.overlap > 0).sort((a, b) => b.overlap - a.overlap).slice(0, 3);

  const W = 320;
  return (
    <SimFrame title="Embeddings and vector search" hint="Each support article is a point; similar meanings sit close together. Pick a user query and compare semantic (vector) search with keyword matching.">
      <div className="space-y-3">
        <Segmented value={String(qi)} onChange={(v) => setQi(Number(v))} options={QUERIES.map((qq, i) => ({ value: String(i), label: `"${qq.text}"` }))} />
        <Segmented value={mode} onChange={setMode} options={[{ value: "semantic", label: "Vector (semantic) search" }, { value: "keyword", label: "Keyword search" }]} />
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-[320px] shrink-0 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          {mode === "semantic" &&
            top.map((d) => (
              <line key={d.text} x1={q.x * W} y1={(1 - q.y) * W} x2={d.x * W} y2={(1 - d.y) * W} stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" />
            ))}
          {DOCS.map((d) => {
            const hit = top.some((t) => t.text === d.text);
            return (
              <circle key={d.text} cx={d.x * W} cy={(1 - d.y) * W} r={hit ? 7 : 5} fill={COLORS[d.topic]} stroke={hit ? "#10b981" : "none"} strokeWidth={3}>
                <title>{d.text}</title>
              </circle>
            );
          })}
          <rect x={q.x * W - 7} y={(1 - q.y) * W - 7} width={14} height={14} fill="#0f172a" className="dark:fill-white" transform={`rotate(45 ${q.x * W} ${(1 - q.y) * W})`} />
        </svg>

        <div className="flex-1 text-sm">
          <div className="mb-2 text-xs font-medium text-slate-500">Top results for the ◆ query</div>
          {top.length === 0 ? (
            <p className="rounded-lg bg-rose-50 p-3 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              No keyword overlap. Keyword search finds nothing, even though relevant articles exist.
            </p>
          ) : (
            <ol className="space-y-2">
              {top.map((d) => (
                <li key={d.text} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.topic] }} />
                  {d.text}
                  <span className="ml-2 text-xs text-slate-500">{mode === "semantic" ? `similarity ${d.sim.toFixed(2)}` : `${d.overlap} shared word(s)`}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {Object.entries(COLORS).map(([k, c]) => (
              <span key={k}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c }} />{k}</span>
            ))}
          </div>
        </div>
      </div>
    </SimFrame>
  );
}
