"use client";

import { useState } from "react";
import { Button, SimFrame, Slider } from "./ui";

const USERS = [
  { key: "alice", color: "bg-sky-500" },
  { key: "bob", color: "bg-violet-500" },
  { key: "carol", color: "bg-amber-500" },
  { key: "dave", color: "bg-emerald-500" },
  { key: "erin", color: "bg-rose-500" },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Msg = { key: string; seq: number };

export function KafkaSim() {
  const [partitions, setPartitions] = useState(3);
  const [consumers, setConsumers] = useState(2);
  const [logs, setLogs] = useState<Msg[][]>([[], [], []]);
  const [committed, setCommitted] = useState<number[]>([0, 0, 0]);
  const [seq, setSeq] = useState(1);

  const reset = (p = partitions) => {
    setLogs(Array.from({ length: p }, () => []));
    setCommitted(Array(p).fill(0));
    setSeq(1);
  };

  // Range-style assignment: partitions spread across consumers in the group.
  const owner = (p: number) => (p % consumers);
  const idle = Math.max(0, consumers - partitions);

  const produce = (key: string) => {
    const p = hash(key) % partitions;
    setLogs((l) => l.map((log, i) => (i === p ? [...log, { key, seq }] : log)));
    setSeq((s) => s + 1);
  };

  const produceBatch = () => {
    let s = seq;
    const next = logs.map((l) => [...l]);
    for (let i = 0; i < 10; i++) {
      const u = USERS[Math.floor(Math.random() * USERS.length)].key;
      next[hash(u) % partitions].push({ key: u, seq: s++ });
    }
    setLogs(next);
    setSeq(s);
  };

  // Each active consumer processes one message from each partition it owns.
  const consume = () => setCommitted((c) => c.map((off, p) => Math.min(off + 1, logs[p].length)));

  const color = (k: string) => USERS.find((u) => u.key === k)!.color;

  return (
    <SimFrame title="Kafka partitions and consumer groups" hint="Messages are routed to a partition by hash(key). Each partition is consumed by exactly one consumer in the group.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Partitions" value={partitions} min={1} max={6} onChange={(v) => { setPartitions(v); reset(v); }} />
        <Slider label="Consumers in group" value={consumers} min={1} max={8} onChange={setConsumers} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500">Produce event for:</span>
        {USERS.map((u) => (
          <button key={u.key} onClick={() => produce(u.key)} className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${u.color}`} /> {u.key}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={produceBatch}>Produce 10 random</Button>
        <Button primary onClick={consume}>Consumers poll →</Button>
        <Button onClick={() => reset()}>Reset</Button>
      </div>

      <div className="mt-5 space-y-2">
        {logs.map((log, p) => (
          <div key={p} className="flex items-center gap-2">
            <div className="w-28 shrink-0 text-xs">
              <div className="font-semibold">partition {p}</div>
              <div className="text-slate-500">→ consumer {owner(p) + 1}</div>
            </div>
            <div className="flex min-h-8 flex-1 items-center gap-1 overflow-x-auto rounded-md bg-slate-50 p-1 dark:bg-slate-800/60">
              {log.map((m, i) => (
                <span
                  key={m.seq}
                  title={`offset ${i}: ${m.key} #${m.seq}`}
                  className={`flex h-6 min-w-6 items-center justify-center rounded px-1 text-[10px] font-mono text-white ${color(m.key)} ${i < committed[p] ? "opacity-30" : ""}`}
                >
                  {i}
                </span>
              ))}
            </div>
            <div className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-500">lag {log.length - committed[p]}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        Same key → same partition → <b>strict order per user</b>. Faded = consumed (offset committed).
        {idle > 0 && (
          <span className="mt-1 block font-semibold text-amber-700 dark:text-amber-400">
            {idle} consumer{idle > 1 ? "s are" : " is"} idle: you can&apos;t have more active consumers than partitions.
          </span>
        )}
      </div>
    </SimFrame>
  );
}
