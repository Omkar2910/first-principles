"use client";

import { useState } from "react";
import { SimFrame, Stat } from "./ui";

const NINES = [99, 99.5, 99.9, 99.95, 99.99, 99.999];

function downtime(pct: number) {
  const f = 1 - pct / 100;
  const perYearMin = f * 365 * 24 * 60;
  const perMonthMin = f * 30 * 24 * 60;
  const fmt = (m: number) => (m >= 60 * 24 ? `${(m / 1440).toFixed(1)} days` : m >= 60 ? `${(m / 60).toFixed(1)} h` : m >= 1 ? `${m.toFixed(1)} min` : `${(m * 60).toFixed(0)} s`);
  return { year: fmt(perYearMin), month: fmt(perMonthMin) };
}

type Dep = { name: string; avail: number; replicas: number };

export function AvailabilityCalculator() {
  const [deps, setDeps] = useState<Dep[]>([
    { name: "Load balancer", avail: 99.99, replicas: 1 },
    { name: "App service", avail: 99.5, replicas: 1 },
    { name: "Database", avail: 99.9, replicas: 1 },
    { name: "Payment API", avail: 99.9, replicas: 1 },
  ]);

  const update = (i: number, patch: Partial<Dep>) => setDeps((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  // Each component: parallel replicas → 1 - (1-a)^n. Chain in series → product.
  const effective = deps.map((d) => 1 - (1 - d.avail / 100) ** d.replicas);
  const total = effective.reduce((a, b) => a * b, 1) * 100;
  const dt = downtime(total);

  return (
    <SimFrame title="Availability math" hint="A request needs every component in the chain (series), so availabilities multiply. Redundant replicas in parallel raise a component's availability.">
      <div className="mb-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-xs">
          <thead>
            <tr className="text-left text-ink-500">
              <th className="pb-2">Component (in series)</th>
              <th className="pb-2">Availability each</th>
              <th className="pb-2">Redundant copies</th>
              <th className="pb-2 text-right">Effective</th>
            </tr>
          </thead>
          <tbody>
            {deps.map((d, i) => (
              <tr key={d.name} className="border-t border-ink-100 dark:border-ink-800">
                <td className="py-2 font-medium">{d.name}</td>
                <td>
                  <select value={d.avail} onChange={(e) => update(i, { avail: Number(e.target.value) })} className="rounded border border-ink-300 bg-white px-1 py-0.5 dark:border-ink-600 dark:bg-ink-800">
                    {NINES.map((n) => <option key={n} value={n}>{n}%</option>)}
                  </select>
                </td>
                <td>
                  <select value={d.replicas} onChange={(e) => update(i, { replicas: Number(e.target.value) })} className="rounded border border-ink-300 bg-white px-1 py-0.5 dark:border-ink-600 dark:bg-ink-800">
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n} {n > 1 ? "(independent)" : ""}</option>)}
                  </select>
                </td>
                <td className="text-right tabular-nums">{(effective[i] * 100).toFixed(4)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="End-to-end availability" value={`${total.toFixed(3)}%`} tone={total < 99.9 ? "text-rose-600" : "text-emerald-600"} />
        <Stat label="Downtime / month" value={dt.month} />
        <Stat label="Downtime / year" value={dt.year} />
      </div>

      <div className="mt-5">
        <div className="mb-1 text-xs font-medium text-ink-500">Reference: what each target allows</div>
        <div className="grid grid-cols-3 gap-1 text-xs sm:grid-cols-6">
          {NINES.map((n) => (
            <div key={n} className="rounded bg-ink-50 p-2 text-center dark:bg-ink-800/60">
              <div className="font-semibold">{n}%</div>
              <div className="text-ink-500">{downtime(n).month}/mo</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500">Assumes independent failures. Real replicas often share failure modes (same bad deploy, same AZ), so true gains are smaller.</p>
    </SimFrame>
  );
}
