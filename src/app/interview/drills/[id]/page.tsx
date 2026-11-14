import Link from "next/link";
import { notFound } from "next/navigation";
import { HLD_PHASES, LLD_PHASES, drills, getDrill } from "@/lib/drills";
import { getLesson } from "@/lib/content";
import { DrillRunner } from "@/components/site/DrillRunner";
import { Badge, LevelBadge } from "@/components/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return drills.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/drills/[id]">) {
  const { id } = await params;
  return { title: `${getDrill(id)?.title} · Drills · First Principles` };
}

export default async function DrillPage({ params }: PageProps<"/interview/drills/[id]">) {
  const { id } = await params;
  const drill = getDrill(id);
  if (!drill) notFound();

  // Resolve every linked lesson at build time, so a broken link fails the build.
  const refs = [drill.lesson, ...drill.rubric.map((r) => r.lesson)];
  const lessonTitles = Object.fromEntries(
    refs.map((ref) => {
      const [t, s] = ref.split("/");
      const lesson = getLesson(t, s);
      if (!lesson) throw new Error(`Drill "${drill.id}" links to missing lesson ${ref}`);
      return [ref, lesson.meta.title];
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/interview" className="hover:text-ink-900 dark:hover:text-white">
          Interview prep
        </Link>
        <span className="mx-2 text-ink-300 dark:text-ink-600">/</span>
        <Link href="/interview/drills" className="hover:text-ink-900 dark:hover:text-white">
          Drills
        </Link>
      </nav>
      <div className="mb-8">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="brand">{drill.kind === "hld" ? "System design" : "Low-level design"}</Badge>
          <LevelBadge level={drill.level} />
        </div>
        <h1 className="mt-3 text-4xl font-bold text-balance">{drill.title}</h1>
      </div>
      <DrillRunner drill={drill} phases={drill.kind === "hld" ? HLD_PHASES : LLD_PHASES} lessonTitles={lessonTitles} />
    </div>
  );
}
