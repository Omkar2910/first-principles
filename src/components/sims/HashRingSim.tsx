"use client";

import { useMemo, useState } from "react";
import { Button, SimFrame, Stat } from "./ui";

const KEYS = Array.from({ length: 60 }, (_, i) => `user:${i * 7 + 13}`);
const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#64748b", "#ec4899", "#14b8a6"];
const RING = 2 ** 32;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}

function assignRing(nodes: number[], vnodes: number) {
  const points = nodes.flatMap((n) => Array.from({ length: vnodes }, (_, v) => ({ node: n, pos: hash(`node-${n}#${v}`) }))).sort((a, b) => a.pos - b.pos);
  const owner = (k: string) => {
    const h = hash(k);
    return (points.find((p) => p.pos >= h) ?? points[0]).node;
  };
  return { points, map: Object.fromEntries(KEYS.map((k) => [k, owner(k)])) as Record<string, number> };
}

function assignModulo(nodes: number[]) {
  return Object.fromEntries(KEYS.map((k) => [k, nodes[hash(k) % nodes.length]])) as Record<string, number>;
}

export function HashRingSim() {
  const [nodes, setNodes] = useState([0, 1, 2, 3]);
  const [vnodes, setVnodes] = useState(1);
  const [prevNodes, setPrevNodes] = useState<number[] | null>(null);

  const ring = useMemo(() => assignRing(nodes, vnodes), [nodes, vnodes]);
  const moved = useMemo(() => {
    if (!prevNodes) return null;
    const before = assignRing(prevNodes, vnodes).map;
    const modBefore = assignModulo(prevNodes);
    const modAfter = assignModulo(nodes);
    return {
      ring: KEYS.filter((k) => before[k] !== ring.map[k]).length,
      mod: KEYS.filter((k) => modBefore[k] !== modAfter[k]).length,
    };
  }, [prevNodes, nodes, vnodes, ring]);

  const counts = nodes.map((n) => KEYS.filter((k) => ring.map[k] === n).length);
  const angle = (pos: number) => (pos / RING) * 2 * Math.PI - Math.PI / 2;
  // Rounded so server- and client-rendered SVG coordinates match exactly (trig can differ in the last digit).
  const pt = (pos: number, r: number) => [150 + r * Math.cos(angle(pos)), 150 + r * Math.sin(angle(pos))].map((v) => Math.round(v * 100) / 100);

  const add = () => {
    const next = [0, 1, 2, 3, 4, 5, 6, 7].find((n) => !nodes.includes(n));
    if (next === undefined) return;
    setPrevNodes(nodes);
    setNodes([...nodes, next]);
  };
  const remove = () => {
    if (nodes.length <= 1) return;
    setPrevNodes(nodes);
    setNodes(nodes.slice(0, -1));
  };

  return (
    <SimFrame title="Consistent hashing ring" hint="Keys (small dots) belong to the next server clockwise. Add or remove a server and compare how many keys move versus hash % N.">
      <div className="flex flex-wrap gap-2">
        <Button primary onClick={add}>+ Add server</Button>
        <Button onClick={remove}>− Remove server</Button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={vnodes > 1} onChange={(e) => { setVnodes(e.target.checked ? 40 : 1); setPrevNodes(null); }} />
          Virtual nodes (40 per server)
        </label>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg viewBox="0 0 300 300" className="w-64 shrink-0">
          <circle cx={150} cy={150} r={120} fill="none" className="stroke-ink-300 dark:stroke-ink-700" strokeWidth={2} />
          {KEYS.map((k) => {
            const [x, y] = pt(hash(k), 108);
            return <circle key={k} cx={x} cy={y} r={3} fill={COLORS[ring.map[k]]} />;
          })}
          {ring.points.map((p, i) => {
            const [x, y] = pt(p.pos, 120);
            return <circle key={i} cx={x} cy={y} r={vnodes > 1 ? 3 : 8} fill={COLORS[p.node]} stroke="white" strokeWidth={vnodes > 1 ? 0.5 : 2} />;
          })}
        </svg>
        <div className="w-full flex-1 space-y-1.5">
          {nodes.map((n, i) => (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full" style={{ background: COLORS[n] }} />
              <span className="w-16">server {n}</span>
              <div className="h-3 flex-1 rounded bg-ink-100 dark:bg-ink-800">
                <div className="h-3 rounded" style={{ width: `${(counts[i] / KEYS.length) * 100}%`, background: COLORS[n] }} />
              </div>
              <span className="w-12 text-right tabular-nums">{counts[i]} keys</span>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-ink-500">Ideal: {(KEYS.length / nodes.length).toFixed(0)} keys each. Without virtual nodes, the split is often very uneven.</p>
        </div>
      </div>

      {moved && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Keys moved: consistent hashing" value={`${moved.ring} / ${KEYS.length}`} tone="text-emerald-600" />
          <Stat label="Keys moved: hash % N" value={`${moved.mod} / ${KEYS.length}`} tone="text-rose-600" />
        </div>
      )}
    </SimFrame>
  );
}
