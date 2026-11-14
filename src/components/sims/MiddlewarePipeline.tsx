"use client";

import { useState } from "react";
import { Button, SimFrame } from "./ui";

type Stage = { name: string; desc: string; fail?: { label: string; status: number; msg: string } };

const STAGES: Stage[] = [
  { name: "Request ID / logging", desc: "Assigns X-Request-Id, starts a timer, puts it in the request context." },
  { name: "CORS", desc: "Checks the Origin header for browser calls.", fail: { label: "Disallowed origin", status: 403, msg: "CORS origin not allowed" } },
  { name: "Rate limiter", desc: "Counts requests per API key.", fail: { label: "Client over limit", status: 429, msg: "Too Many Requests" } },
  { name: "Authentication", desc: "Validates the token, attaches userId to the context.", fail: { label: "Expired token", status: 401, msg: "Unauthorized" } },
  { name: "Authorization", desc: "Does this user have orders:write?", fail: { label: "Missing permission", status: 403, msg: "Forbidden" } },
  { name: "Body parsing + validation", desc: "JSON → OrderRequest, checks qty > 0.", fail: { label: "qty = -3", status: 400, msg: "qty must be positive" } },
  { name: "Controller → service", desc: "Your business logic runs.", fail: { label: "Bug throws NPE", status: 500, msg: "Internal Server Error" } },
];

export function MiddlewarePipeline() {
  const [failAt, setFailAt] = useState<number | null>(null);
  const [step, setStep] = useState(-1);

  const stopAt = failAt ?? STAGES.length;
  const finished = step >= Math.min(stopAt, STAGES.length - 1);

  const run = () => {
    setStep(-1);
    let i = -1;
    const tick = () => {
      i++;
      setStep(i);
      if (i < Math.min(stopAt, STAGES.length - 1)) setTimeout(tick, 450);
    };
    setTimeout(tick, 100);
  };

  const status = failAt !== null ? STAGES[failAt].fail!.status : 201;

  return (
    <SimFrame title="Middleware pipeline" hint="Pick where things go wrong (or nothing), then send POST /orders through the chain.">
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => { setFailAt(null); setStep(-1); }}
          className={`rounded-md border px-2 py-1 text-xs ${failAt === null ? "border-emerald-600 bg-emerald-600 text-white" : "border-ink-300 dark:border-ink-600"}`}
        >
          Happy path
        </button>
        {STAGES.map((s, i) =>
          s.fail ? (
            <button
              key={s.name}
              onClick={() => { setFailAt(i); setStep(-1); }}
              className={`rounded-md border px-2 py-1 text-xs ${failAt === i ? "border-rose-600 bg-rose-600 text-white" : "border-ink-300 dark:border-ink-600"}`}
            >
              {s.fail.label}
            </button>
          ) : null,
        )}
      </div>
      <Button primary onClick={run}>▶ Send request</Button>

      <ol className="mt-5 space-y-1.5">
        {STAGES.map((s, i) => {
          const reached = step >= i;
          const failedHere = reached && failAt === i;
          const skipped = failAt !== null && i > failAt;
          return (
            <li
              key={s.name}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                failedHere
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                  : reached
                    ? "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10"
                    : skipped && finished
                      ? "border-ink-200 opacity-40 dark:border-ink-800"
                      : "border-ink-200 dark:border-ink-800"
              }`}
            >
              <span className="w-5 shrink-0 text-center">{failedHere ? "✕" : reached ? "✓" : i + 1}</span>
              <span>
                <b>{s.name}</b>
                <span className="block text-xs text-ink-600 dark:text-ink-400">
                  {failedHere ? `Short-circuits: responds ${s.fail!.status} ${s.fail!.msg}. Later stages never run.` : s.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {finished && step >= 0 && (
        <div className={`mt-4 rounded-lg p-3 font-mono text-sm ${status < 400 ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-rose-100 dark:bg-rose-500/15"}`}>
          ← HTTP {status} {status === 201 ? "Created" : STAGES[failAt!].fail!.msg} · logged by stage 1 with the same request id
        </div>
      )}
    </SimFrame>
  );
}
