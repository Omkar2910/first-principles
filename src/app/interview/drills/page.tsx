import Link from "next/link";
import { drills } from "@/lib/drills";
import { DrillStatus } from "@/components/site/InterviewClient";
import { Badge, Card, LevelBadge, PageHeader } from "@/components/ui";

export const metadata = { title: "Design drills · First Principles" };

export default function DrillsPage() {
  const groups = [
    { kind: "hld", title: "System design", blurb: "45 minutes, following the six-step framework." },
    { kind: "lld", title: "Low-level design", blurb: "45 minutes: classes, patterns, concurrency and code." },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/interview" className="hover:text-ink-900 dark:hover:text-white">
          Interview prep
        </Link>
        <span className="mx-2 text-ink-300 dark:text-ink-600">/</span>
        <span>Drills</span>
      </nav>
      <PageHeader eyebrow="Mock rounds" title="Design drills">
        A real prompt, a real clock and an honest checklist. Talk through your design out loud, then see exactly which
        points you missed and where they&apos;re taught.
      </PageHeader>
      {groups.map((g) => (
        <section key={g.kind} className="mb-12">
          <h2 className="text-2xl font-bold">{g.title}</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">{g.blurb}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drills
              .filter((d) => d.kind === g.kind)
              .map((d) => (
                <Link key={d.id} href={`/interview/drills/${d.id}`} className="group rounded-2xl">
                  <Card interactive className="flex h-full flex-col p-5">
                    <div className="flex gap-1.5">
                      <LevelBadge level={d.level} />
                      <Badge>{d.rubric.length} checkpoints</Badge>
                    </div>
                    <h3 className="font-display mt-3 text-lg font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{d.title}</h3>
                    <p className="mt-1 line-clamp-3 text-sm text-ink-500">{d.prompt}</p>
                    <div className="mt-auto pt-4">
                      <DrillStatus id={d.id} />
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
