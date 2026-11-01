import { tracks } from "@/lib/tracks";
import { getLessons, getQuizzes } from "@/lib/content";
import { ProgressDashboard } from "@/components/site/ProgressDashboard";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Progress · First Principles" };

export default function ProgressPage() {
  const summaries = tracks
    .map((t) => {
      const lessons = getLessons(t.slug);
      return {
        slug: t.slug,
        title: t.title,
        number: t.number,
        lessons: lessons.map((l) => `${t.slug}/${l.slug}`),
        questions: lessons.flatMap((l) => getQuizzes(t.slug, l.slug).map((q) => q.question)),
      };
    })
    .filter((t) => t.lessons.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader eyebrow="Dashboard" title="Your progress">
        What you&apos;ve covered, how well it&apos;s sticking, and how consistently you show up.
      </PageHeader>
      <ProgressDashboard tracks={summaries} />
    </div>
  );
}
