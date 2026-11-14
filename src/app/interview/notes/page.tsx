import Link from "next/link";
import { stages, tracks } from "@/lib/tracks";
import { getLessons } from "@/lib/content";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Revision notes · First Principles" };

export default function NotesIndex() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/interview" className="hover:text-ink-900 dark:hover:text-white">
          Interview prep
        </Link>
        <span className="mx-2 text-ink-300 dark:text-ink-600">/</span>
        <span>Revision notes</span>
      </nav>
      <PageHeader eyebrow="Cheat sheets" title="Revision notes">
        Every track on one page: each lesson&apos;s key takeaways and trade-offs, generated from the lessons so they never
        drift. Made for the evening before an interview.
      </PageHeader>
      {stages.map((stage) => (
        <section key={stage.id} className="mb-10">
          <h2 className="mb-4 text-xl font-bold">{stage.label.replace(/^Stage \d+ · /, "")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tracks
              .filter((t) => t.stage === stage.id)
              .map((t) => (
                <Link key={t.slug} href={`/interview/notes/${t.slug}`} className="group rounded-2xl">
                  <Card interactive className="h-full p-4">
                    <div className="font-mono text-xs text-ink-400">{getLessons(t.slug).length} lessons</div>
                    <div className="font-display mt-1 font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{t.title}</div>
                    <div className="mt-0.5 text-sm text-ink-500">{t.tagline}</div>
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
