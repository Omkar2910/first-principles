import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/tracks";
import { getLessons, groupBySection } from "@/lib/content";
import { LessonRow, TrackCta, TrackProgress } from "@/components/site/client";
import { Badge, Card, Eyebrow, LevelBadge } from "@/components/ui";

// Only lessons that exist on disk; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.filter((t) => getLessons(t.slug).length > 0).map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tracks/[track]">) {
  const { track } = await params;
  return { title: `${getTrack(track)?.title} · First Principles` };
}

export default async function TrackPage({ params }: PageProps<"/tracks/[track]">) {
  const { track: slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();
  const lessons = getLessons(slug);
  const minutes = lessons.reduce((a, l) => a + l.minutes, 0);
  const slugs = lessons.map((l) => l.slug);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-10 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link href="/#roadmap" className="hover:text-slate-900 dark:hover:text-white">
              Roadmap
            </Link>
            <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
            <span>Track {String(track.number).padStart(2, "0")}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{track.title}</h1>
          <p className="mt-2 text-lg font-medium text-brand-700 dark:text-brand-300">{track.tagline}</p>
          <p className="mt-4 max-w-2xl text-pretty text-slate-600 dark:text-slate-400">{track.description}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {track.topics.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackCta track={slug} slugs={slugs} />
            <div className="flex-1 sm:max-w-sm">
              <TrackProgress track={slug} slugs={slugs} />
              <div className="mt-1.5 text-xs text-slate-500">
                {lessons.length} lessons · about {Math.round(minutes / 60)} hours
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {groupBySection(lessons).map((group) => (
          <section key={group.section ?? "all"} className="mb-8">
            {group.section && <Eyebrow className="mb-3">{group.section}</Eyebrow>}
            <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
              {group.lessons.map((l) => (
                <LessonRow
                  key={l.slug}
                  track={slug}
                  slug={l.slug}
                  title={l.title}
                  description={l.description}
                  index={lessons.indexOf(l) + 1}
                  meta={
                    <>
                      <span className="text-xs tabular-nums text-slate-500">{l.minutes} min</span>
                      <LevelBadge level={l.level} />
                    </>
                  }
                />
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
