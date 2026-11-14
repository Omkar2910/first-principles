"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Segmented, SimFrame } from "./ui";

type Level = 1 | 2 | 3 | 4;
const LEVEL_NAMES: Record<Level, string> = { 1: "Junior", 2: "Mid", 3: "Senior", 4: "Lead" };

type Competency = { id: string; area: string; name: string; levels: [string, string, string, string]; learn: string };

const COMPETENCIES: Competency[] = [
  { id: "design", area: "Technical", name: "System design", levels: ["Implements within an existing design", "Designs features/components with sound tradeoffs", "Designs systems spanning services; anticipates scale & failure", "Sets architectural direction across teams"], learn: "/tracks/hld/design-framework" },
  { id: "code", area: "Technical", name: "Code quality", levels: ["Writes working, readable code with guidance", "Writes clean, tested, maintainable code independently", "Raises the codebase quality bar; designs good abstractions", "Defines standards and patterns adopted widely"], learn: "/tracks/lld/oop-done-right" },
  { id: "debug", area: "Technical", name: "Debugging & operations", levels: ["Debugs local issues with help", "Debugs production issues in own services", "Leads incident investigations across systems", "Builds reliability practices for the org"], learn: "/tracks/reliability/incident-response" },
  { id: "ai", area: "Technical", name: "AI-native engineering", levels: ["Uses AI tools for scoped tasks, reviews output", "Delivers features with agents; builds simple AI features", "Designs AI systems with evals, cost & safety", "Shapes team/org AI practices and strategy"], learn: "/tracks/ai-native/working-with-coding-agents" },
  { id: "scope", area: "Execution", name: "Scope of ownership", levels: ["Well-defined tasks", "Features end to end", "Projects / systems with ambiguity", "Multi-team initiatives / problem spaces"], learn: "/tracks/career-ladder/from-tasks-to-features" },
  { id: "estimate", area: "Execution", name: "Planning & estimation", levels: ["Estimates own tasks with help", "Plans and delivers features predictably", "Plans projects with milestones and risks", "Plans roadmaps across quarters and teams"], learn: "/tracks/career-ladder/estimation-and-communication" },
  { id: "prod", area: "Ownership", name: "Production ownership", levels: ["Fixes bugs assigned to them", "Owns their service in production (on-call, alerts)", "Owns reliability of a system: SLOs, readiness reviews", "Owns operational excellence across teams"], learn: "/tracks/career-ladder/owning-production" },
  { id: "debt", area: "Ownership", name: "Code health & tech debt", levels: ["Leaves code no worse", "Refactors opportunistically, flags debt", "Prioritizes and pays down strategic debt", "Balances debt vs product at roadmap level"], learn: "/tracks/career-ladder/tech-debt-and-code-health" },
  { id: "write", area: "Communication", name: "Written communication", levels: ["Clear PR descriptions and updates", "Clear design notes and docs for features", "Design docs/RFCs that drive decisions", "Strategy docs that align the org"], learn: "/tracks/career-ladder/design-docs-and-tradeoffs" },
  { id: "stake", area: "Communication", name: "Stakeholder communication", levels: ["Communicates within the team", "Works directly with PM/design on features", "Negotiates scope and tradeoffs with stakeholders", "Represents engineering to leadership"], learn: "/tracks/career-ladder/communicating-with-leadership" },
  { id: "mentor", area: "Leadership", name: "Mentoring & reviews", levels: ["Receives feedback well", "Gives helpful code reviews", "Mentors others; grows team capability", "Develops senior engineers and leaders"], learn: "/tracks/career-ladder/multiplying-others" },
  { id: "influence", area: "Leadership", name: "Influence & decisions", levels: ["Contributes ideas in team discussions", "Drives decisions within the team", "Influences across teams without authority", "Sets technical direction others follow"], learn: "/tracks/career-ladder/cross-team-influence" },
];

const KEY = "fp:self-assessment:v1";

type Saved = { ratings: Record<string, Level>; target: Level };
const DEFAULT: Saved = { ratings: {}, target: 3 };

// Tiny localStorage-backed store so answers survive reloads without hydration mismatches.
let cache: Saved | null = null;
const listeners = new Set<() => void>();
function read(): Saved {
  if (cache) return cache;
  try {
    cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}
function write(next: Saved) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function SelfAssessment() {
  const saved = useSyncExternalStore(subscribe, read, () => DEFAULT);
  const { ratings, target } = saved;
  const setRatings = (f: (r: Record<string, Level>) => Record<string, Level>) => write({ ...saved, ratings: f(ratings) });
  const setTarget = (t: Level) => write({ ...saved, target: t });

  const rated = COMPETENCIES.filter((c) => ratings[c.id]);
  const gaps = COMPETENCIES.filter((c) => ratings[c.id] && ratings[c.id] < target).sort((a, b) => ratings[a.id] - ratings[b.id]);
  const areas = [...new Set(COMPETENCIES.map((c) => c.area))];

  return (
    <SimFrame title="Self-assessment" hint="For each competency, pick the level you demonstrate consistently (not occasionally). Your answers are saved in this browser only.">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">My target level:</span>
        <Segmented value={String(target)} onChange={(v) => setTarget(Number(v) as Level)} options={[2, 3, 4].map((l) => ({ value: String(l), label: LEVEL_NAMES[l as Level] }))} />
      </div>

      <div className="space-y-6">
        {areas.map((area) => (
          <div key={area}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">{area}</h4>
            <div className="space-y-3">
              {COMPETENCIES.filter((c) => c.area === area).map((c) => (
                <div key={c.id} className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
                  <div className="mb-2 text-sm font-medium">{c.name}</div>
                  <div className="grid gap-1.5 sm:grid-cols-4">
                    {c.levels.map((desc, i) => {
                      const lvl = (i + 1) as Level;
                      const on = ratings[c.id] === lvl;
                      return (
                        <button
                          key={i}
                          onClick={() => setRatings((r) => ({ ...r, [c.id]: lvl }))}
                          className={`rounded-md border p-2 text-left text-xs transition ${
                            on ? "border-violet-500 bg-violet-50 dark:bg-violet-500/15" : "border-ink-200 hover:border-ink-400 dark:border-ink-700"
                          } ${lvl === target ? "ring-1 ring-amber-400/60" : ""}`}
                        >
                          <span className="mb-0.5 block font-semibold">{LEVEL_NAMES[lvl]}</span>
                          <span className="text-ink-600 dark:text-ink-400">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-ink-50 p-4 dark:bg-ink-800/60">
        <div className="mb-2 text-sm font-semibold">
          Your growth plan ({rated.length}/{COMPETENCIES.length} rated, target {LEVEL_NAMES[target]})
        </div>
        {rated.length === 0 ? (
          <p className="text-sm text-ink-500">Rate a few competencies to see your gaps.</p>
        ) : gaps.length === 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            No gaps in what you&apos;ve rated. Collect evidence (see the promotions lesson) and talk to your manager.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {gaps.map((g) => (
              <li key={g.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{g.name}</span>
                <span className="text-xs text-ink-500">
                  {LEVEL_NAMES[ratings[g.id]]} → {LEVEL_NAMES[target]}: “{g.levels[target - 1]}”
                </span>
                <Link href={g.learn} className="text-xs text-sky-700 underline dark:text-sky-400">
                  Study this →
                </Link>
              </li>
            ))}
          </ul>
        )}
        {rated.length > 0 && (
          <button onClick={() => setRatings(() => ({}))} className="mt-3 text-xs text-ink-500 underline">
            Clear my answers
          </button>
        )}
      </div>
    </SimFrame>
  );
}
