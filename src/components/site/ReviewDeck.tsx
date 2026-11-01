"use client";

import Link from "next/link";
import { Kbd, Segmented, buttonClass } from "@/components/ui";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { lessonId, useCompleted, useCompletions } from "@/lib/progress";
import { dueQueue, previewInterval, rate, useSrs, type Rating } from "@/lib/srs";

export type ReviewCard = { track: string; trackTitle: string; slug: string; title: string; takeaways: string[] };

/** New (never reviewed) cards introduced per session, so a big backlog stays manageable. */
const NEW_PER_SESSION = 10;

const RATINGS: { rating: Rating; label: string; key: string; tone: string }[] = [
  { rating: "again", label: "Forgot", key: "1", tone: "border-rose-300 hover:bg-rose-50 dark:border-rose-500/40 dark:hover:bg-rose-500/10" },
  { rating: "hard", label: "Hard", key: "2", tone: "border-amber-300 hover:bg-amber-50 dark:border-amber-500/40 dark:hover:bg-amber-500/10" },
  { rating: "good", label: "Good", key: "3", tone: "border-emerald-300 hover:bg-emerald-50 dark:border-emerald-500/40 dark:hover:bg-emerald-500/10" },
  { rating: "easy", label: "Easy", key: "4", tone: "border-sky-300 hover:bg-sky-50 dark:border-sky-500/40 dark:hover:bg-sky-500/10" },
];

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ReviewDeck({ cards, tracks }: { cards: ReviewCard[]; tracks: { slug: string; title: string }[] }) {
  const [mode, setMode] = useState<"due" | "browse">("due");
  return (
    <div>
      <Segmented
        className="mb-6"
        options={[
          { value: "due", label: "Spaced review" },
          { value: "browse", label: "Browse all" },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === "due" ? <DueSession cards={cards} /> : <Browse cards={cards} tracks={tracks} />}
    </div>
  );
}

/* ---------- Spaced repetition session ---------- */

function DueSession({ cards }: { cards: ReviewCard[] }) {
  const srs = useSrs();
  const completions = useCompletions();
  const byId = useMemo(() => new Map(cards.map((c) => [lessonId(c.track, c.slug), c])), [cards]);

  const { due, fresh } = dueQueue(srs, completions);
  const dueIds = due.filter((id) => byId.has(id));
  const freshIds = fresh.filter((id) => byId.has(id));
  const scheduled = Object.keys(srs).length;

  // The queue is snapshotted when a session starts so cards don't reshuffle mid-review.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = queue?.[0] ? byId.get(queue[0]) : undefined;

  const answer = (rating: Rating) => {
    if (!queue?.length) return;
    const [id, ...rest] = queue;
    rate(id, rating);
    setReviewed((n) => n + 1);
    setRevealed(false);
    // A forgotten card comes back at the end of this session.
    setQueue(rating === "again" ? [...rest, id] : rest);
  };

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const r = RATINGS.find((x) => x.key === e.key);
        if (r) answer(r.rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!queue) {
    const total = dueIds.length + Math.min(freshIds.length, NEW_PER_SESSION);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat value={dueIds.length} label="due today" />
          <Stat value={freshIds.length} label="new" />
          <Stat value={scheduled} label="in rotation" />
        </div>
        {total > 0 ? (
          <button
            onClick={() => {
              setReviewed(0);
              setQueue([...dueIds, ...freshIds.slice(0, NEW_PER_SESSION)]);
            }}
            className={buttonClass("brand", "lg", "mt-6 w-full")}
          >
            Start review · {total} card{total === 1 ? "" : "s"}
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-slate-500">
            {scheduled === 0
              ? "Lessons join your review rotation when you mark them complete."
              : "Nothing due. Come back tomorrow, or use Browse all to cram."}
          </p>
        )}
        <p className="mt-4 text-center text-xs text-slate-500">
          Rate how well you recalled each lesson. Cards you know well come back less often; the ones you forget come back
          sooner.
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="text-3xl">✓</div>
        <h2 className="mt-2 text-xl font-semibold">Session complete</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {reviewed} review{reviewed === 1 ? "" : "s"} done. Your next cards are scheduled.
        </p>
        <div className="mt-5 flex justify-center gap-3 text-sm">
          <button onClick={() => setQueue(null)} className={buttonClass("secondary")}>
            Back to overview
          </button>
          <Link href="/practice" className={buttonClass("brand")}>
            Practice quizzes →
          </Link>
        </div>
      </div>
    );
  }

  const state = srs[queue[0]];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>{queue.length} left in session</span>
        <span>{state ? `Seen ${state.reps + state.lapses}×` : "New card"}</span>
      </div>
      <CardFace card={current} revealed={revealed}>
        {revealed ? (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((r) => (
              <button key={r.rating} onClick={() => answer(r.rating)} className={`rounded-lg border px-3 py-2 text-sm ${r.tone}`}>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-slate-500">
                  {previewInterval(state, r.rating)} <Kbd className="ml-1">{r.key}</Kbd>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <RevealButton onClick={() => setRevealed(true)} />
        )}
      </CardFace>
    </div>
  );
}

/* ---------- Browse (unscheduled cramming) ---------- */

function Browse({ cards, tracks }: { cards: ReviewCard[]; tracks: { slug: string; title: string }[] }) {
  const completed = useCompleted();
  const [track, setTrack] = useState("all");
  const [onlyDone, setOnlyDone] = useState(false);
  const [seed, setSeed] = useState(7);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const deck = useMemo(() => {
    const filtered = cards.filter(
      (c) => (track === "all" || c.track === track) && (!onlyDone || completed.includes(lessonId(c.track, c.slug))),
    );
    return shuffle(filtered, seed);
  }, [cards, track, onlyDone, completed, seed]);

  const card = deck[i % Math.max(deck.length, 1)];
  const restart = () => { setI(0); setRevealed(false); };
  const next = () => { setRevealed(false); setI((x) => (x + 1) % Math.max(deck.length, 1)); };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <select
          value={track}
          onChange={(e) => { setTrack(e.target.value); restart(); }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm shadow-xs dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All tracks</option>
          {tracks.map((t) => (
            <option key={t.slug} value={t.slug}>{t.title}</option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyDone} onChange={(e) => { setOnlyDone(e.target.checked); restart(); }} />
          Only lessons I&apos;ve completed
        </label>
        <button onClick={() => { setSeed((s) => s + 1); restart(); }} className={buttonClass("secondary", "sm")}>
          Shuffle
        </button>
        <span className="text-slate-500">{deck.length ? `Card ${(i % deck.length) + 1} of ${deck.length}` : ""}</span>
      </div>

      {!card ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No cards yet. Complete some lessons, or untick &ldquo;only completed&rdquo;.
        </p>
      ) : (
        <CardFace card={card} revealed={revealed}>
          {!revealed && <RevealButton onClick={() => setRevealed(true)} />}
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
            <button onClick={next} className={buttonClass("secondary")}>
              Next card →
            </button>
          </div>
        </CardFace>
      )}
    </div>
  );
}

/* ---------- Shared pieces ---------- */

function CardFace({ card, revealed, children }: { card: ReviewCard; revealed: boolean; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">{card.trackTitle}</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{card.title}</h2>
        </div>
        <Link href={`/tracks/${card.track}/${card.slug}`} className="shrink-0 text-sm text-sky-700 underline dark:text-sky-400">
          Re-read
        </Link>
      </div>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        Before revealing: explain the key ideas of this lesson out loud, as if teaching a teammate.
      </p>
      {revealed && (
        <ul className="mt-5 space-y-2">
          {card.takeaways.map((t) => (
            <li key={t} className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
              <span className="text-emerald-600">✓</span>
              {t}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

function RevealButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={buttonClass("primary", "md", "mt-6")}>
      Reveal key takeaways <Kbd className="ml-1 border-white/30 bg-white/10 text-white/70 dark:border-slate-300 dark:bg-slate-100 dark:text-slate-500">space</Kbd>
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
