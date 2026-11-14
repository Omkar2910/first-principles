import Link from "next/link";
import { tracks } from "@/lib/tracks";
import { getLesson } from "@/lib/content";
import { ROUNDS, getAllInterviewQuestions } from "@/lib/interview";
import { renderLesson } from "@/components/mdx";
import { QuestionBank, type BankItem } from "@/components/site/QuestionBank";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Interview questions · First Principles" };

export default async function QuestionsPage() {
  const questions = getAllInterviewQuestions();
  const items: BankItem[] = await Promise.all(
    questions.map(async (q) => ({
      id: q.id,
      track: q.track,
      trackTitle: tracks.find((t) => t.slug === q.track)?.title ?? q.track,
      question: q.question,
      round: q.round,
      roundLabel: ROUNDS[q.round],
      level: q.level,
      lessons: q.lessons.map((ref) => {
        const [t, s] = ref.split("/");
        const lesson = getLesson(t, s);
        if (!lesson) throw new Error(`Interview question "${q.question}" links to missing lesson ${ref}`);
        return { href: `/tracks/${t}/${s}`, title: lesson.meta.title };
      }),
      answer: await renderLesson(q.body),
    })),
  );
  const withQuestions = tracks.filter((t) => questions.some((q) => q.track === t.slug));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/interview" className="hover:text-ink-900 dark:hover:text-white">
          Interview prep
        </Link>
        <span className="mx-2 text-ink-300 dark:text-ink-600">/</span>
        <span>Questions</span>
      </nav>
      <PageHeader eyebrow="Question bank" title="Questions interviewers actually ask">
        Each one comes with a model answer, what a strong answer covers, and the follow-ups to expect. Rate yourself and
        shaky answers come back for another try.
      </PageHeader>
      <QuestionBank
        items={items}
        tracks={withQuestions.map((t) => ({ slug: t.slug, title: t.title }))}
        rounds={Object.entries(ROUNDS).map(([value, label]) => ({ value, label }))}
      />
    </div>
  );
}
