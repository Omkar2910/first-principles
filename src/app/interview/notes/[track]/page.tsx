import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, tracks } from "@/lib/tracks";
import { getLessons, getTakeaways, getTradeoffs } from "@/lib/content";
import { getInterviewQuestions } from "@/lib/interview";
import { PrintButton } from "@/components/site/client";
import { Eyebrow } from "@/components/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.filter((t) => getLessons(t.slug).length > 0).map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/interview/notes/[track]">) {
  const { track } = await params;
  return { title: `${getTrack(track)?.title} revision notes · First Principles` };
}

/** One-page cheat sheet: every lesson's takeaways and trade-offs, built from the lessons themselves. */
export default async function NotesPage({ params }: PageProps<"/interview/notes/[track]">) {
  const { track: slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();
  const lessons = getLessons(slug);
  const questions = getInterviewQuestions(slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 print:max-w-none print:p-0">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500 print:hidden">
        <Link href="/interview" className="hover:text-ink-900 dark:hover:text-white">
          Interview prep
        </Link>
        <span className="mx-2 text-ink-300 dark:text-ink-600">/</span>
        <Link href="/interview/notes" className="hover:text-ink-900 dark:hover:text-white">
          Revision notes
        </Link>
      </nav>
      <header className="mb-8 flex flex-col gap-4 border-b-2 border-ink-900 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-ink-100">
        <div>
          <Eyebrow className="text-brand-700 dark:text-brand-400">Revision notes · Track {String(track.number).padStart(2, "0")}</Eyebrow>
          <h1 className="mt-1 text-4xl font-bold">{track.title}</h1>
          <p className="mt-1 text-ink-500">{lessons.length} lessons on one page. Read it the night before; print it if you like.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          {questions.length > 0 && (
            <Link
              href={`/interview/questions?track=${slug}`}
              className="inline-flex h-9 items-center rounded-lg border border-ink-300 px-4 text-sm font-medium hover:border-ink-400 dark:border-ink-700"
            >
              {questions.length} questions →
            </Link>
          )}
        </div>
      </header>

      <div className="columns-1 gap-8 md:columns-2 print:columns-2 print:text-[11px]">
        {lessons.map((l, i) => {
          const takeaways = getTakeaways(slug, l.slug);
          const tradeoffs = getTradeoffs(slug, l.slug);
          return (
            <section key={l.slug} className="mb-7 break-inside-avoid">
              <h2 className="font-display flex items-baseline gap-2 text-lg font-bold">
                <span className="font-mono text-xs text-ink-400">{String(i + 1).padStart(2, "0")}</span>
                <Link href={`/tracks/${slug}/${l.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                  {l.title}
                </Link>
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {takeaways.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              {tradeoffs && (tradeoffs.good.length > 0 || tradeoffs.bad.length > 0) && (
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-ink-100/60 p-3 text-xs dark:bg-ink-800/50">
                  <div>
                    <div className="mb-1 font-semibold text-emerald-700 dark:text-emerald-400">Gains</div>
                    <ul className="space-y-1 text-ink-600 dark:text-ink-300">
                      {tradeoffs.good.map((g) => (
                        <li key={g}>+ {g}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-rose-700 dark:text-rose-400">Costs</div>
                    <ul className="space-y-1 text-ink-600 dark:text-ink-300">
                      {tradeoffs.bad.map((b) => (
                        <li key={b}>− {b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
