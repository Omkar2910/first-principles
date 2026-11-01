import Link from "next/link";
import { stages, tracks } from "@/lib/tracks";
import { getAllLessons, getAllQuizzes, getLessons } from "@/lib/content";
import { TrackStatus } from "@/components/site/client";
import { ContinueLearning } from "@/components/site/ContinueLearning";
import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import * as sims from "@/components/sims";

export default function Home() {
  const all = getAllLessons();
  const ordered = all.map((l) => ({ track: l.track, slug: l.slug, title: l.title, trackTitle: tracks.find((t) => t.slug === l.track)!.title }));
  const hours = Math.round(all.reduce((a, l) => a + l.minutes, 0) / 60);
  const stats = [
    { value: tracks.length, label: "tracks" },
    { value: all.length, label: "lessons" },
    { value: `~${hours}h`, label: "of reading" },
    { value: getAllQuizzes().length, label: "quizzes" },
    { value: Object.keys(sims).length, label: "simulators" },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-16 pb-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:pt-24 lg:pb-20">
          <div className="max-w-3xl">
            <Badge tone="brand" className="mb-5 px-2.5 py-1 text-xs">
              Backend · System Design · AI-native · Career
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Engineering from{" "}
              <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-sky-300">
                first principles
              </span>
              .
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-pretty text-slate-600 sm:text-xl dark:text-slate-400">
              A guided path from how a request travels to designing distributed systems and leading a team. Every lesson
              starts with the problem a concept solves, explains it simply, then lets you play with it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/tracks/foundations" variant="brand" size="lg">
                Start with Foundations →
              </ButtonLink>
              <ButtonLink href="/guide" variant="secondary" size="lg">
                How it works
              </ButtonLink>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</span>{" "}
                    <span className="text-sm text-slate-500">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ContinueLearning lessons={ordered} />
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <Eyebrow className="text-brand-600 dark:text-brand-400">The roadmap</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Four stages, twelve tracks</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Work top to bottom, or jump to whatever you need this week. Each track stands on its own, but later stages
            assume the earlier ones.
          </p>
        </div>

        <ol className="space-y-14">
          {stages.map((stage, si) => (
            <li key={stage.id} className="relative grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-brand-50 font-mono text-sm font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                    {si + 1}
                  </span>
                  <h3 className="font-semibold">{stage.label.replace(/^Stage \d+ · /, "")}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-500 lg:pl-12">{stage.blurb}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tracks
                  .filter((t) => t.stage === stage.id)
                  .map((t) => {
                    const lessons = getLessons(t.slug);
                    const minutes = lessons.reduce((a, l) => a + l.minutes, 0);
                    return (
                      <Link key={t.slug} href={`/tracks/${t.slug}`} className="group rounded-2xl">
                        <Card interactive className="flex h-full flex-col p-5">
                          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                            <span>Track {String(t.number).padStart(2, "0")}</span>
                            <span>
                              {lessons.length} lessons · {Math.round(minutes / 60)}h
                            </span>
                          </div>
                          <h4 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-brand-700 dark:group-hover:text-brand-300">
                            {t.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {t.topics.slice(0, 4).map((topic) => (
                              <Badge key={topic}>{topic}</Badge>
                            ))}
                          </div>
                          <div className="mt-auto pt-5">
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                              <TrackStatus track={t.slug} slugs={lessons.map((l) => l.slug)} />
                              <span
                                aria-hidden
                                className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600"
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
