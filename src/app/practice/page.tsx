import { tracks } from "@/lib/tracks";
import { getAllQuizzes } from "@/lib/content";
import { Practice } from "@/components/site/Practice";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Practice · First Principles" };

export default function PracticePage() {
  const quizzes = getAllQuizzes();
  const withQuizzes = new Set(quizzes.map((q) => q.track));
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader eyebrow="Retrieval practice" title="Practice">
        Every quiz from every lesson in one place. Mixing tracks makes you recall the right idea without the lesson
        around it as a hint.
      </PageHeader>
      <Practice
        quizzes={quizzes}
        tracks={tracks.filter((t) => withQuizzes.has(t.slug)).map((t) => ({ slug: t.slug, title: t.title }))}
      />
    </div>
  );
}
