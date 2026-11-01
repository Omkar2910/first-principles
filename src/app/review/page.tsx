import { tracks } from "@/lib/tracks";
import { getAllLessons, getTakeaways } from "@/lib/content";
import { ReviewDeck, type ReviewCard } from "@/components/site/ReviewDeck";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Review · First Principles" };

export default function ReviewPage() {
  const cards: ReviewCard[] = getAllLessons()
    .map((l) => ({
      track: l.track,
      trackTitle: tracks.find((t) => t.slug === l.track)?.title ?? l.track,
      slug: l.slug,
      title: l.title,
      takeaways: getTakeaways(l.track, l.slug),
    }))
    .filter((c) => c.takeaways.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader eyebrow="Spaced repetition" title="Review">
        Active recall beats re-reading. Explain each lesson&apos;s key ideas from memory, then check yourself.
      </PageHeader>
      <ReviewDeck cards={cards} tracks={tracks.map((t) => ({ slug: t.slug, title: t.title }))} />
    </div>
  );
}
