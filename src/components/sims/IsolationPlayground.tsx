"use client";

import { useState } from "react";
import { Button, Segmented, SimFrame } from "./ui";

type Level = "RU" | "RC" | "RR" | "SER";
type Step = { tx: "A" | "B"; sql: string; result?: Partial<Record<Level, string>> & { all?: string } };
type ScenarioDef = { id: string; name: string; setup: string; steps: Step[]; verdict: Record<Level, { bad: boolean; text: string }> };

const SCENARIOS: ScenarioDef[] = [
  {
    id: "dirty",
    name: "Dirty read",
    setup: "accounts: id=1, balance=100",
    steps: [
      { tx: "A", sql: "BEGIN; UPDATE accounts SET balance = 50 WHERE id = 1;" },
      { tx: "B", sql: "BEGIN; SELECT balance FROM accounts WHERE id = 1;", result: { RU: "→ 50 (uncommitted!)", all: "→ 100" } },
      { tx: "A", sql: "ROLLBACK;" },
      { tx: "B", sql: "-- B makes a decision based on what it read; COMMIT;" },
    ],
    verdict: {
      RU: { bad: true, text: "B acted on 50, a value that never officially existed." },
      RC: { bad: false, text: "B only sees committed data, so it read 100." },
      RR: { bad: false, text: "No dirty reads." },
      SER: { bad: false, text: "No dirty reads." },
    },
  },
  {
    id: "nonrepeat",
    name: "Non-repeatable read",
    setup: "accounts: id=1, balance=100",
    steps: [
      { tx: "B", sql: "BEGIN; SELECT balance FROM accounts WHERE id = 1;", result: { all: "→ 100" } },
      { tx: "A", sql: "BEGIN; UPDATE accounts SET balance = 50 WHERE id = 1; COMMIT;" },
      { tx: "B", sql: "SELECT balance FROM accounts WHERE id = 1;", result: { RU: "→ 50", RC: "→ 50", RR: "→ 100", SER: "→ 100" } },
      { tx: "B", sql: "COMMIT;" },
    ],
    verdict: {
      RU: { bad: true, text: "Same query, same transaction, different answers." },
      RC: { bad: true, text: "Each statement sees the latest committed data, so the value changed mid-transaction. (Postgres/Oracle default!)" },
      RR: { bad: false, text: "B reads from a snapshot taken at its start: stable 100." },
      SER: { bad: false, text: "Stable snapshot." },
    },
  },
  {
    id: "lost",
    name: "Lost update",
    setup: "posts: id=7, likes=10",
    steps: [
      { tx: "A", sql: "BEGIN; SELECT likes FROM posts WHERE id = 7;", result: { all: "→ 10" } },
      { tx: "B", sql: "BEGIN; SELECT likes FROM posts WHERE id = 7;", result: { all: "→ 10" } },
      { tx: "A", sql: "UPDATE posts SET likes = 11 WHERE id = 7; COMMIT;" },
      { tx: "B", sql: "UPDATE posts SET likes = 11 WHERE id = 7; COMMIT;", result: { RU: "→ OK", RC: "→ OK", RR: "→ ERROR: could not serialize access", SER: "→ ERROR: could not serialize access" } },
    ],
    verdict: {
      RU: { bad: true, text: "Final likes = 11. One like vanished." },
      RC: { bad: true, text: "Final likes = 11. One like vanished. Fix: UPDATE likes = likes + 1, or SELECT … FOR UPDATE." },
      RR: { bad: false, text: "Postgres aborts B; the app must retry. (MySQL InnoDB's RR does NOT prevent this!)" },
      SER: { bad: false, text: "B aborted; retry gives 12." },
    },
  },
  {
    id: "skew",
    name: "Write skew",
    setup: "doctors on call: Alice ✓, Bob ✓ (rule: at least 1 must stay on call)",
    steps: [
      { tx: "A", sql: "BEGIN; SELECT count(*) FROM doctors WHERE on_call;  -- Alice checks", result: { all: "→ 2 (ok to leave)" } },
      { tx: "B", sql: "BEGIN; SELECT count(*) FROM doctors WHERE on_call;  -- Bob checks", result: { all: "→ 2 (ok to leave)" } },
      { tx: "A", sql: "UPDATE doctors SET on_call = false WHERE name = 'Alice'; COMMIT;" },
      { tx: "B", sql: "UPDATE doctors SET on_call = false WHERE name = 'Bob'; COMMIT;", result: { RU: "→ OK", RC: "→ OK", RR: "→ OK", SER: "→ ERROR: could not serialize access" } },
    ],
    verdict: {
      RU: { bad: true, text: "Zero doctors on call. Each transaction was valid alone." },
      RC: { bad: true, text: "Zero doctors on call." },
      RR: { bad: true, text: "Zero doctors on call. Snapshot isolation does not prevent write skew: they updated different rows." },
      SER: { bad: false, text: "Serializable detects the dependency and aborts Bob's transaction." },
    },
  },
  {
    id: "phantom",
    name: "Phantom read",
    setup: "tickets: 3 rows with status='open'",
    steps: [
      { tx: "B", sql: "BEGIN; SELECT count(*) FROM tickets WHERE status = 'open';", result: { all: "→ 3" } },
      { tx: "A", sql: "BEGIN; INSERT INTO tickets(status) VALUES ('open'); COMMIT;" },
      { tx: "B", sql: "SELECT count(*) FROM tickets WHERE status = 'open';", result: { RU: "→ 4", RC: "→ 4", RR: "→ 3", SER: "→ 3" } },
      { tx: "B", sql: "COMMIT;" },
    ],
    verdict: {
      RU: { bad: true, text: "A new row appeared mid-transaction." },
      RC: { bad: true, text: "A new row appeared mid-transaction." },
      RR: { bad: false, text: "Postgres' snapshot hides it (the SQL standard technically allows phantoms at RR)." },
      SER: { bad: false, text: "No phantoms." },
    },
  },
];

const LEVELS: { value: Level; label: string }[] = [
  { value: "RU", label: "Read Uncommitted" },
  { value: "RC", label: "Read Committed" },
  { value: "RR", label: "Repeatable Read" },
  { value: "SER", label: "Serializable" },
];

export function IsolationPlayground() {
  const [sid, setSid] = useState("lost");
  const [level, setLevel] = useState<Level>("RC");
  const [step, setStep] = useState(-1);
  const sc = SCENARIOS.find((s) => s.id === sid)!;
  const done = step >= sc.steps.length - 1;

  return (
    <SimFrame title="Isolation level playground" hint="Pick an anomaly and an isolation level, then step through two concurrent transactions. (Behavior shown is PostgreSQL's.)">
      <div className="space-y-3">
        <Segmented value={sid} onChange={(v) => { setSid(v); setStep(-1); }} options={SCENARIOS.map((s) => ({ value: s.id, label: s.name }))} />
        <Segmented value={level} onChange={(v) => { setLevel(v); setStep(-1); }} options={LEVELS} />
      </div>
      <p className="mt-3 font-mono text-xs text-slate-500">Initial: {sc.setup}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className="rounded bg-sky-100 px-2 py-1 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200">Transaction A</div>
        <div className="rounded bg-violet-100 px-2 py-1 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200">Transaction B</div>
      </div>
      <div className="mt-2 space-y-1.5">
        {sc.steps.map((s, i) => {
          const shown = i <= step;
          const res = s.result ? (s.result[level] ?? s.result.all) : undefined;
          const cell = (
            <div className={`rounded-md border p-2 font-mono text-[11px] transition ${shown ? "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" : "border-dashed border-slate-200 text-slate-400 dark:border-slate-800"}`}>
              {s.sql}
              {shown && res && <div className={`mt-1 font-semibold ${res.includes("ERROR") || res.includes("!") ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"}`}>{res}</div>}
            </div>
          );
          return (
            <div key={i} className="grid grid-cols-2 gap-2">
              {s.tx === "A" ? cell : <div />}
              {s.tx === "B" ? cell : <div />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button primary onClick={() => setStep((x) => Math.min(x + 1, sc.steps.length - 1))}>Next step →</Button>
        <Button onClick={() => setStep(-1)}>Reset</Button>
      </div>

      {done && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${sc.verdict[level].bad ? "bg-rose-100 dark:bg-rose-500/15" : "bg-emerald-100 dark:bg-emerald-500/15"}`}>
          <b>{sc.verdict[level].bad ? "Anomaly happened." : "Protected."}</b> {sc.verdict[level].text}
        </div>
      )}
    </SimFrame>
  );
}
