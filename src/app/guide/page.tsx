import { getDoc, getHeadings } from "@/lib/content";
import { renderLesson } from "@/components/mdx";
import { OnThisPage } from "@/components/site/OnThisPage";
import { PageHeader } from "@/components/ui";

// The guide's source of truth is docs/user-guide.md, also readable in the repo.
const doc = getDoc("user-guide");

export const metadata = { title: "User guide · First Principles", description: doc.description };

export default async function GuidePage() {
  const content = await renderLesson(doc.body);
  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16">
      <article className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl">
          <PageHeader eyebrow="Help" title="How to use First Principles">
            {doc.description}
          </PageHeader>
          <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-h2:mt-14 prose-h2:text-2xl prose-a:text-brand-700 dark:prose-a:text-brand-300 prose-td:align-top">
            {content}
          </div>
        </div>
      </article>
      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <OnThisPage headings={getHeadings(doc.body)} />
        </div>
      </aside>
    </div>
  );
}
