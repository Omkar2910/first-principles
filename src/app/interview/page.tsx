import Link from "next/link";
import { ROUNDS, getAllInterviewQuestions } from "@/lib/interview";
import { drills } from "@/lib/drills";
import { InterviewStats } from "@/components/site/InterviewClient";
import { ButtonLink, Card, Eyebrow } from "@/components/ui";

export const metadata = {
  title: "Interview prep · First Principles",
  description: "Interviewer-style questions with model answers, timed system design drills and one-page revision notes.",
};

const ROUNDS_BY_LEVEL = [
  {
    round: "Concepts / backend",
    mid: "Explains how things work and why: HTTP, databases, caching, queues",
    senior: "Explains trade-offs and failure modes, with examples from experience",
  },
  {
    round: "System design",
    mid: "Builds a reasonable design with some guidance",
    senior: "Drives: requirements, estimates, deep dives, failure modes, trade-offs",
  },
  {
    round: "Low-level design",
    mid: "Sensible classes, a working core flow, some patterns",
    senior: "Clean abstractions at the variation points, concurrency, crisp scope",
  },
  {
    round: "Behavioral",
    mid: "Owned features end to end; handled feedback and setbacks",
    senior: "Led projects, influenced across teams, mentored, owned production",
  },
];

const PLAN = [
  { week: "1", focus: "Foundations & backend", do: "Question bank: Foundations, Backend. Re-read any lesson you rate “Missed”." },
  { week: "2", focus: "Data", do: "Questions: Data. Drill: URL shortener. Revision notes: Data." },
  { week: "3", focus: "Scaling building blocks", do: "Questions: Scaling. Drills: rate limiter, notification system." },
  { week: "4", focus: "Distributed systems", do: "Questions: Distributed Systems. Drills: chat system, payment system." },
  { week: "5", focus: "Design under pressure", do: "Two or three drills, timed, out loud. LLD: parking lot, Splitwise." },
  { week: "6", focus: "Stories & polish", do: "Behavioral questions + your 8–10 STAR stories. Clear everything due. Read the notes the night before." },
];

export default function InterviewHub() {
  const questions = getAllInterviewQuestions();
  const byRound = Object.entries(ROUNDS).map(([key, label]) => ({ label, n: questions.filter((q) => q.round === key).length }));

  const tools = [
    {
      href: "/interview/questions",
      eyebrow: `${questions.length} questions`,
      title: "Question bank",
      body: `The questions interviewers ask, with a model answer, what a strong answer covers, and likely follow-ups. ${byRound
        .filter((r) => r.n)
        .map((r) => `${r.n} ${r.label.toLowerCase()}`)
        .join(" · ")}.`,
      cta: "Practise questions",
    },
    {
      href: "/interview/drills",
      eyebrow: `${drills.length} drills`,
      title: "Design drills",
      body: "A real prompt and a 45-minute clock that walks you through the framework, then an honest checklist that links to anything you missed.",
      cta: "Start a drill",
    },
    {
      href: "/interview/notes",
      eyebrow: "12 tracks",
      title: "Revision notes",
      body: "Each track's takeaways and trade-offs on one printable page. Generated from the lessons, so they always match.",
      cta: "Open the notes",
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200/70 dark:border-ink-800/70">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 lg:pt-20">
          <p className="font-mono text-xs tracking-wider text-brand-700 uppercase dark:text-brand-400">Interview prep</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] font-extrabold text-balance sm:text-6xl">
            Walk in ready to reason out loud.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600 dark:text-ink-400">
            Interviews test whether you can explain <em>why</em>, under time pressure, at the right level. Practise exactly
            that: answer before you look, design against the clock, and let spaced repetition bring back what you fumbled.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/interview/questions" variant="brand" size="lg">
              Start with the question bank →
            </ButtonLink>
            <ButtonLink href="/interview/drills" variant="secondary" size="lg">
              Try a 45-minute drill
            </ButtonLink>
          </div>
          <div className="mt-10">
            <InterviewStats questionIds={questions.map((q) => q.id)} drillCount={drills.length} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid gap-4 pt-14 md:grid-cols-3">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="group rounded-2xl">
              <Card interactive className="flex h-full flex-col p-6">
                <Eyebrow className="text-brand-700 dark:text-brand-400">{t.eyebrow}</Eyebrow>
                <h2 className="mt-2 text-2xl font-bold">{t.title}</h2>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">{t.body}</p>
                <span className="mt-auto pt-5 text-sm font-medium text-brand-700 group-hover:underline dark:text-brand-400">{t.cta} →</span>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-10 pt-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold">What each round tests</h2>
            <p className="mt-2 text-sm text-ink-500">
              The same question gets very different expectations by level. Many candidates are down-levelled for answering
              at the wrong altitude, not for lacking skill.{" "}
              <Link href="/tracks/career-ladder/interviews-by-level" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                Full guide →
              </Link>
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-200 text-xs tracking-wide text-ink-500 uppercase dark:border-ink-800">
                  <tr>
                    <th className="p-3 font-semibold">Round</th>
                    <th className="p-3 font-semibold">Mid (SDE2)</th>
                    <th className="p-3 font-semibold">Senior (SDE3)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {ROUNDS_BY_LEVEL.map((r) => (
                    <tr key={r.round} className="align-top">
                      <td className="p-3 font-medium">{r.round}</td>
                      <td className="p-3 text-ink-600 dark:text-ink-400">{r.mid}</td>
                      <td className="p-3 text-ink-600 dark:text-ink-400">{r.senior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold">A six-week plan</h2>
            <p className="mt-2 text-sm text-ink-500">
              About an hour a day. Coding/DSA rounds aren&apos;t covered here: keep a daily coding practice alongside this.
            </p>
            <ol className="mt-5 space-y-2">
              {PLAN.map((p) => (
                <li key={p.week} className="flex gap-4 rounded-xl border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900/40">
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {p.week}
                  </span>
                  <div>
                    <div className="font-semibold">{p.focus}</div>
                    <div className="text-sm text-ink-600 dark:text-ink-400">{p.do}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-ink-200 bg-ink-900 p-8 text-ink-100 dark:border-ink-800">
          <h2 className="text-2xl font-bold text-white">In the room</h2>
          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <li><strong className="text-white">Clarify before solving.</strong> State assumptions; confirm scope.</li>
            <li><strong className="text-white">Think aloud.</strong> Interviewers grade reasoning, not just answers.</li>
            <li><strong className="text-white">Drive, at senior level.</strong> Propose the structure and manage the time.</li>
            <li><strong className="text-white">Name trade-offs and unknowns.</strong> “I&apos;d validate this with a load test” beats bluffing.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
