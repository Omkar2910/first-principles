import Link from "next/link";
import { stages, tracks } from "@/lib/tracks";
import { getAllLessons, getAllQuizzes, getLessons } from "@/lib/content";
import { getAllInterviewQuestions } from "@/lib/interview";
import { drills } from "@/lib/drills";
import { TrackStatus } from "@/components/site/client";
import { ContinueLearning } from "@/components/site/ContinueLearning";
import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import * as sims from "@/components/sims";

export default function Home() {
  const all = getAllLessons();
  const ordered = all.map((l) => ({ track: l.track, slug: l.slug, title: l.title, trackTitle: tracks.find((t) => t.slug === l.track)!.title }));
  const hours = Math.round(all.reduce((a, l) => a + l.minutes, 0) / 60);
  const questions = getAllInterviewQuestions().length;
  const stats = [
    { value: all.length, label: "lessons" },
    { value: `~${hours}h`, label: "of reading" },
    { value: getAllQuizzes().length, label: "quizzes" },
    { value: questions, label: "interview questions" },
    { value: Object.keys(sims).length, label: "simulators" },
  ];

  const modes = [
    {
      n: "01",
      title: "Learn",
      body: "Twelve tracks, from how a request travels to leading a team. Every lesson starts with the problem, then lets you play with it.",
      href: "/#roadmap",
      cta: "See the roadmap",
    },
    {
      n: "02",
      title: "Remember",
      body: "Spaced-repetition review and mixed-track practice, so what you read is still there in three months.",
      href: "/review",
      cta: "Open review",
    },
    {
      n: "03",
      title: "Interview",
      body: `${questions} interviewer-style questions with model answers, ${drills.length} timed system design drills, and one-page revision notes per track.`,
      href: "/interview",
      cta: "Start interview prep",
      highlight: true,
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200/70 dark:border-ink-800/70">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:pt-24 lg:pb-20">
          <div className="max-w-3xl">
            <p className="mb-6 font-mono text-xs tracking-wider text-ink-500 uppercase">
              A field guide for backend engineers
            </p>
            <h1 className="text-[2.75rem] leading-[1.02] font-extrabold text-balance sm:text-7xl">
              Engineering, from{" "}
              <span className="relative whitespace-nowrap text-brand-600 dark:text-brand-400">
                first principles
                <svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden className="absolute -bottom-2 left-0 h-3 w-full">
                  <path d="M2 8 C 60 2, 120 11, 180 5 S 270 3, 298 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-pretty text-ink-600 sm:text-xl dark:text-ink-400">
              Backend, system design, AI-native engineering and career growth. Understand <em>why</em> things work, practise
              until it sticks, and walk into interviews ready to reason out loud.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/tracks/foundations" variant="brand" size="lg">
                Start with Foundations →
              </ButtonLink>
              <ButtonLink href="/interview" variant="secondary" size="lg">
                Prepare for interviews
              </ButtonLink>
            </div>
          </div>
          <ContinueLearning lessons={ordered} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-ink-200 bg-white/70 sm:grid-cols-5 dark:border-ink-800 dark:bg-ink-900/40">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`border-ink-200 p-4 sm:p-5 dark:border-ink-800 ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "border-l sm:border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <dt className="text-xs text-ink-500">{s.label}</dt>
                <dd className="font-display mt-1 text-3xl font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((m) => (
            <Link key={m.n} href={m.href} className="group rounded-2xl">
              <Card
                interactive
                className={`flex h-full flex-col p-6 ${m.highlight ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/5" : ""}`}
              >
                <span className="font-mono text-xs text-ink-400">{m.n}</span>
                <h2 className="mt-3 text-2xl font-bold">{m.title}</h2>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">{m.body}</p>
                <span className="mt-auto pt-5 text-sm font-medium text-brand-700 group-hover:underline dark:text-brand-400">
                  {m.cta} →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <Eyebrow className="text-brand-700 dark:text-brand-400">The roadmap</Eyebrow>
          <h2 className="mt-2 text-4xl font-bold">Four stages, twelve tracks</h2>
          <p className="mt-3 text-ink-600 dark:text-ink-400">
            Work top to bottom, or jump to whatever you need this week. Each track stands on its own, but later stages
            assume the earlier ones.
          </p>
        </div>

        <ol className="space-y-16">
          {stages.map((stage, si) => (
            <li key={stage.id} className="relative grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="font-mono text-xs tracking-wider text-brand-700 uppercase dark:text-brand-400">Stage {si + 1}</div>
                <h3 className="font-display mt-1 text-2xl font-bold">{stage.label.replace(/^Stage \d+ · /, "")}</h3>
                <p className="mt-2 text-sm text-ink-500">{stage.blurb}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tracks
                  .filter((t) => t.stage === stage.id)
                  .map((t) => {
                    const lessons = getLessons(t.slug);
                    const minutes = lessons.reduce((a, l) => a + l.minutes, 0);
                    return (
                      <Link key={t.slug} href={`/tracks/${t.slug}`} className="group rounded-2xl">
                        <Card interactive className="relative flex h-full flex-col overflow-hidden p-5">
                          <span
                            aria-hidden
                            className="font-display pointer-events-none absolute -top-3 right-3 text-[5.5rem] leading-none font-extrabold text-ink-100 transition-colors group-hover:text-brand-100 dark:text-ink-800/60 dark:group-hover:text-brand-500/15"
                          >
                            {String(t.number).padStart(2, "0")}
                          </span>
                          <div className="relative font-mono text-xs text-ink-400">
                            {lessons.length} lessons · {Math.round(minutes / 60)}h
                          </div>
                          <h4 className="font-display relative mt-6 text-xl font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">
                            {t.title}
                          </h4>
                          <p className="relative mt-1 text-sm text-ink-500">{t.tagline}</p>
                          <div className="relative mt-4 flex flex-wrap gap-1.5">
                            {t.topics.slice(0, 4).map((topic) => (
                              <Badge key={topic}>{topic}</Badge>
                            ))}
                          </div>
                          <div className="mt-auto pt-5">
                            <div className="flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
                              <TrackStatus track={t.slug} slugs={lessons.map((l) => l.slug)} />
                              <span
                                aria-hidden
                                className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-ink-600"
                              >
                                →
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
