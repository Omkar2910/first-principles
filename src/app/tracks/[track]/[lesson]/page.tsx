import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/tracks";
import { getAllLessonParams, getHeadings, getLesson, getLessons, groupBySection } from "@/lib/content";
import { renderLesson } from "@/components/mdx";
import { LessonLink, MarkComplete, TrackProgress } from "@/components/site/client";
import { Badge, Eyebrow, LevelBadge } from "@/components/ui";
import { OnThisPage, ReadingProgress } from "@/components/site/OnThisPage";

// Only lessons that exist on disk; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessonParams();
}

export async function generateMetadata({ params }: PageProps<"/tracks/[track]/[lesson]">) {
  const { track, lesson } = await params;
  const data = getLesson(track, lesson);
  return { title: `${data?.meta.title} · First Principles`, description: data?.meta.description };
}

export default async function LessonPage({ params }: PageProps<"/tracks/[track]/[lesson]">) {
  const { track: trackSlug, lesson: slug } = await params;
  const track = getTrack(trackSlug);
  const lesson = getLesson(trackSlug, slug);
  if (!track || !lesson) notFound();

  const lessons = getLessons(trackSlug);
  const idx = lessons.findIndex((l) => l.slug === slug);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  // At the end of a track, point to the first lesson of the next track that has content.
  const nextTrack = next
    ? undefined
    : tracks
        .filter((t) => t.number > track.number)
        .map((t) => ({ track: t, first: getLessons(t.slug)[0] }))
        .find((t) => t.first);
  const headings = getHeadings(lesson.body);
  const content = await renderLesson(lesson.body);

  const nextHref = next
    ? { href: `/tracks/${trackSlug}/${next.slug}`, title: next.title }
    : nextTrack && { href: `/tracks/${nextTrack.track.slug}/${nextTrack.first.slug}`, title: nextTrack.track.title };

  const lessonNav = groupBySection(lessons).map((group) => (
    <div key={group.section ?? "all"}>
      {group.section && <Eyebrow className="mt-4 mb-1.5 px-2.5 text-[11px] text-slate-400 dark:text-slate-500">{group.section}</Eyebrow>}
      <div className="space-y-0.5">
        {group.lessons.map((l) => (
          <LessonLink key={l.slug} track={trackSlug} slug={l.slug} title={l.title} index={lessons.indexOf(l) + 1} active={l.slug === slug} />
        ))}
      </div>
    </div>
  ));

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 sm:px-6">
      <ReadingProgress />
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <Link href={`/tracks/${trackSlug}`} className="group mb-3 block rounded-xl px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60">
            <div className="font-mono text-[11px] text-slate-400">Track {String(track.number).padStart(2, "0")}</div>
            <div className="text-sm font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{track.title}</div>
            <div className="mt-2">
              <TrackProgress track={trackSlug} slugs={lessons.map((l) => l.slug)} />
            </div>
          </Link>
          <nav aria-label="Lessons in this track" className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 pb-4">
            {lessonNav}
          </nav>
        </div>
      </aside>

      <article className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
            <Link href="/#roadmap" className="hover:text-slate-900 dark:hover:text-white">Roadmap</Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <Link href={`/tracks/${trackSlug}`} className="hover:text-slate-900 dark:hover:text-white">{track.title}</Link>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-[2.6rem] sm:leading-tight">{lesson.meta.title}</h1>
          <p className="mt-3 text-lg text-pretty text-slate-600 dark:text-slate-400">{lesson.meta.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge>
              Lesson {idx + 1} of {lessons.length}
            </Badge>
            <Badge>{lesson.meta.minutes} min read</Badge>
            <LevelBadge level={lesson.meta.level} />
            <Link href="/guide#about-the-content" className="rounded-full">
              {lesson.meta.reviewed ? (
                <Badge tone="emerald" title={`Claims checked against primary sources on ${lesson.meta.reviewed}`}>
                  ✓ Fact-checked{" "}
                  {new Date(lesson.meta.reviewed).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
                </Badge>
              ) : (
                <Badge title="This lesson hasn't been checked against primary sources yet">Not yet fact-checked</Badge>
              )}
            </Link>
          </div>

          {/* Phones and tablets get the track's lesson list as a collapsible menu. */}
          <details className="group mt-6 rounded-xl border border-slate-200 lg:hidden dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
              All lessons in {track.title}
              <span className="text-slate-400 transition group-open:rotate-180" aria-hidden>▾</span>
            </summary>
            <nav className="border-t border-slate-200 p-2 dark:border-slate-800">{lessonNav}</nav>
          </details>

          <div className="prose prose-slate mt-10 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-h2:mt-14 prose-h2:text-2xl prose-a:font-medium prose-a:text-brand-700 prose-a:decoration-brand-300 prose-a:underline-offset-2 hover:prose-a:decoration-brand-500 prose-strong:font-semibold dark:prose-a:text-brand-300 dark:prose-a:decoration-brand-500/50">
            {content}
          </div>

          <div className="mt-14">
            <MarkComplete track={trackSlug} slug={slug} next={nextHref || undefined} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/tracks/${trackSlug}/${prev.slug}`}
                className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/50"
              >
                <div className="text-xs text-slate-500">← Previous</div>
                <div className="mt-0.5 font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300">{prev.title}</div>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Link
                href={`/tracks/${trackSlug}/${next.slug}`}
                className="group rounded-xl border border-slate-200 p-4 text-right transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/50"
              >
                <div className="text-xs text-slate-500">Next →</div>
                <div className="mt-0.5 font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300">{next.title}</div>
              </Link>
            )}
            {nextTrack && (
              <Link
                href={`/tracks/${nextTrack.track.slug}/${nextTrack.first.slug}`}
                className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-right transition-colors hover:border-brand-400 dark:border-brand-500/30 dark:bg-brand-500/10"
              >
                <div className="text-xs text-brand-700 dark:text-brand-300">Track complete · Next track →</div>
                <div className="mt-0.5 font-medium">{nextTrack.track.title}</div>
              </Link>
            )}
          </div>
        </div>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <OnThisPage headings={headings} />
        </div>
      </aside>
    </div>
  );
}
