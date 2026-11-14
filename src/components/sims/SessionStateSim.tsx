"use client";

import { useState } from "react";
import { Button, Segmented, SimFrame, Stat } from "./ui";

type Mode = "memory" | "sticky" | "redis" | "token";
type Outcome = "ok" | "relogin" | "down" | "revoked-ok" | "revoked";
type Server = { name: string; alive: boolean; sessions: string[] };
type State = {
  servers: Server[];
  redis: { alive: boolean; sessions: string[] };
  pins: Record<string, number>;
  revoked: string[];
  rr: number;
  last: Record<string, { server: string; outcome: Outcome }>;
  stats: { requests: number; ok: number; relogins: number; errors: number };
};

const USERS = ["Asha", "Ben", "Chen", "Dana", "Eli", "Femi"];

const OUTCOME: Record<Outcome, { label: string; tone: string }> = {
  ok: { label: "✓ served", tone: "text-emerald-600 dark:text-emerald-400" },
  relogin: { label: "✗ session not found: logged out", tone: "text-rose-600 dark:text-rose-400" },
  down: { label: "✗ 503: session store down", tone: "text-rose-600 dark:text-rose-400" },
  revoked: { label: "✓ rejected (logged out)", tone: "text-emerald-600 dark:text-emerald-400" },
  "revoked-ok": { label: "⚠ still accepted: token valid until exp", tone: "text-amber-600 dark:text-amber-400" },
};

/** Every user logs in once; the login request lands on servers in turn. */
function initial(mode: Mode): State {
  const servers: Server[] = ["app-1", "app-2", "app-3"].map((name) => ({ name, alive: true, sessions: [] }));
  const pins: Record<string, number> = {};
  USERS.forEach((u, i) => {
    pins[u] = i % 3;
    if (mode === "memory" || mode === "sticky") servers[i % 3].sessions.push(u);
  });
  return {
    servers,
    redis: { alive: true, sessions: mode === "redis" ? [...USERS] : [] },
    pins,
    revoked: [],
    rr: 1, // the next request after login rarely lands on the same server
    last: {},
    stats: { requests: 0, ok: 0, relogins: 0, errors: 0 },
  };
}

function sendAll(s: State, mode: Mode): State {
  const servers = s.servers.map((x) => ({ ...x, sessions: [...x.sessions] }));
  const redis = { ...s.redis, sessions: [...s.redis.sessions] };
  const pins = { ...s.pins };
  const last = { ...s.last };
  const stats = { ...s.stats };
  let rr = s.rr;
  const live = servers.map((_, i) => i).filter((i) => servers[i].alive);

  for (const u of USERS) {
    if (live.length === 0) break;
    stats.requests++;
    let idx: number;
    if (mode === "sticky" && servers[pins[u]].alive) idx = pins[u];
    else {
      // Round robin; a sticky LB re-pins the user to the new target, as AWS ALB does.
      idx = live[rr++ % live.length];
      pins[u] = idx;
    }
    const server = servers[idx];
    const revoked = s.revoked.includes(u);
    let outcome: Outcome;

    if (mode === "token") {
      outcome = revoked ? "revoked-ok" : "ok";
    } else if (mode === "redis") {
      if (!redis.alive) outcome = "down";
      else if (revoked) outcome = "revoked";
      else outcome = redis.sessions.includes(u) ? "ok" : "relogin";
      if (outcome === "relogin") redis.sessions.push(u);
    } else if (revoked) {
      outcome = "revoked";
    } else if (server.sessions.includes(u)) {
      outcome = "ok";
    } else {
      outcome = "relogin";
      // The user logs in again here; the new session cookie replaces the old one.
      for (const x of servers) x.sessions = x.sessions.filter((v) => v !== u);
      server.sessions.push(u);
    }

    if (outcome === "ok" || outcome === "revoked" || outcome === "revoked-ok") stats.ok++;
    else if (outcome === "relogin") stats.relogins++;
    else stats.errors++;
    last[u] = { server: server.name, outcome };
  }
  rr++; // other users' traffic shifts the rotation between rounds
  return { ...s, servers, redis, pins, last, stats, rr };
}

export function SessionStateSim() {
  const [mode, setMode] = useState<Mode>("memory");
  const [s, setS] = useState<State>(() => initial("memory"));

  const choose = (m: Mode) => {
    setMode(m);
    setS(initial(m));
  };
  const toggleServer = (i: number) =>
    setS((p) => ({
      ...p,
      servers: p.servers.map((x, j) => (j === i ? { ...x, alive: !x.alive, sessions: [] } : x)),
    }));
  const deploy = () => setS((p) => ({ ...p, servers: p.servers.map((x) => ({ ...x, alive: true, sessions: [] })) }));
  const logOutAsha = () =>
    setS((p) => ({
      ...p,
      revoked: p.revoked.includes("Asha") ? p.revoked : [...p.revoked, "Asha"],
      servers: p.servers.map((x) => ({ ...x, sessions: x.sessions.filter((u) => u !== "Asha") })),
      redis: { ...p.redis, sessions: p.redis.sessions.filter((u) => u !== "Asha") },
    }));

  const holdsState = mode === "memory" || mode === "sticky";
  const load = s.servers.map((_, i) => USERS.filter((u) => s.last[u] && s.pins[u] === i).length);

  return (
    <SimFrame
      title="Where does the session live?"
      hint="Six users are logged in. Pick a strategy, send requests, then kill a server, redeploy, or log Asha out, and watch who stays logged in."
    >
      <Segmented
        value={mode}
        onChange={choose}
        options={[
          { value: "memory", label: "In server memory" },
          { value: "sticky", label: "Memory + sticky sessions" },
          { value: "redis", label: "Shared Redis store" },
          { value: "token", label: "Signed token (JWT)" },
        ]}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button primary onClick={() => setS((p) => sendAll(p, mode))}>▶ Every user sends a request</Button>
        <Button onClick={deploy}>Redeploy (restart all servers)</Button>
        <Button onClick={logOutAsha}>Log Asha out</Button>
        <Button onClick={() => setS(initial(mode))}>Reset</Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {s.servers.map((x, i) => (
          <div key={x.name} className={`rounded-lg border p-3 text-xs ${x.alive ? "border-ink-200 dark:border-ink-700" : "border-rose-500 bg-rose-50 dark:bg-rose-500/10"}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{x.alive ? "🟢" : "💀"} {x.name}</span>
              <button onClick={() => toggleServer(i)} className="rounded border border-ink-300 px-1.5 py-0.5 dark:border-ink-600">
                {x.alive ? "Kill" : "Revive"}
              </button>
            </div>
            <div className="mt-2 text-ink-500">{holdsState ? "Sessions in memory" : "Holds no session state"}</div>
            <div className="mt-1 min-h-5">{holdsState ? x.sessions.join(", ") || "—" : "—"}</div>
            {mode === "sticky" && <div className="mt-1 text-ink-500">pinned users: {load[i]}</div>}
          </div>
        ))}
      </div>

      {mode === "redis" && (
        <div className={`mt-3 rounded-lg border p-3 text-xs ${s.redis.alive ? "border-ink-200 dark:border-ink-700" : "border-rose-500 bg-rose-50 dark:bg-rose-500/10"}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{s.redis.alive ? "🟢" : "💀"} Redis (shared session store)</span>
            <button onClick={() => setS((p) => ({ ...p, redis: { ...p.redis, alive: !p.redis.alive } }))} className="rounded border border-ink-300 px-1.5 py-0.5 dark:border-ink-600">
              {s.redis.alive ? "Kill" : "Revive"}
            </button>
          </div>
          <div className="mt-1">{s.redis.sessions.join(", ") || "—"}</div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <tbody>
            {USERS.map((u) => (
              <tr key={u} className="border-t border-ink-100 dark:border-ink-800">
                <td className="py-1 pr-3 font-medium">{u}</td>
                <td className="py-1 pr-3 text-ink-500">{s.last[u]?.server ?? "not sent yet"}</td>
                <td className={`py-1 ${s.last[u] ? OUTCOME[s.last[u].outcome].tone : ""}`}>{s.last[u] ? OUTCOME[s.last[u].outcome].label : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Requests" value={s.stats.requests} />
        <Stat label="Served" value={s.stats.ok} />
        <Stat label="Forced re-logins" value={s.stats.relogins} tone={s.stats.relogins ? "text-rose-600" : ""} />
        <Stat label="Errors" value={s.stats.errors} tone={s.stats.errors ? "text-rose-600" : ""} />
      </div>
    </SimFrame>
  );
}
