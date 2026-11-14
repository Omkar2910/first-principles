"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { dayNumber } from "@/lib/store";
import { previewInterval } from "@/lib/srs";
import { ANSWER_RATINGS, isDue, rateQuestion, useQuestionSrs } from "@/lib/interviewState";
import { Badge, LevelBadge, Segmented, buttonClass } from "@/components/ui";

export type BankItem = {
  id: string;
  track: string;
  trackTitle: string;
  question: string;
  round: string;
  roundLabel: string;
  level: "junior" | "mid" | "senior" | "lead";
  lessons: { href: string; title: string }[];
  answer: ReactNode;
};

type View = "all" | "due" | "new";

const noSubscribe = () => () => {};
/** Read-once view of the URL, for deep links; empty during prerendering. */
function useUrl() {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const hash = useSyncExternalStore(noSubscribe, () => window.location.hash, () => "");
  return { search, hash };
}

export function QuestionBank({
  items,
  tracks,
  rounds,
  initialTrack = "all",
}: {
  items: BankItem[];
  tracks: { slug: string; title: string }[];
  rounds: { value: string; label: string }[];
  initialTrack?: string;
}) {
  const srs = useQuestionSrs();
  // Deep links (/interview/questions?track=data) pick the track filter until the learner changes it.
  const urlTrack = new URLSearchParams(useUrl().search).get("track");
  const [chosenTrack, setTrack] = useState<string | null>(null);
  const track = chosenTrack ?? (urlTrack && tracks.some((x) => x.slug === urlTrack) ? urlTrack : initialTrack);
  const [round, setRound] = useState("all");
  const [view, setView] = useState<View>("all");

  const today = dayNumber();
  const dueCount = items.filter((i) => isDue(srs[i.id], today)).length;
  const ratedCount = items.filter((i) => srs[i.id]).length;

  const shown = useMemo(
    () =>
      items.filter(
        (i) =>
          (track === "all" || i.track === track) &&
          (round === "all" || i.round === round) &&
          (view === "all" || (view === "due" ? isDue(srs[i.id], today) : !srs[i.id])),
      ),
    [items, track, round, view, srs, today],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-ink-800 dark:bg-ink-900/40">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-500">Track</span>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="rounded-lg border border-ink-300 bg-white px-2 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-900"
          >
            <option value="all">All tracks</option>
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <Segmented options={[{ value: "all", label: "Any round" }, ...rounds]} value={round} onChange={setRound} />
        <Segmented
          className="sm:ml-auto"
          options={[
            { value: "all", label: "All" },
            { value: "due", label: `Due (${dueCount})` },
            { value: "new", label: `Not tried (${items.length - ratedCount})` },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      <p className="mb-4 text-sm text-ink-500">
        {shown.length} question{shown.length === 1 ? "" : "s"}. Answer out loud before you reveal: that&apos;s the skill the interview tests.
      </p>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 p-8 text-center text-sm text-ink-500 dark:border-ink-700">
          {view === "due" ? "Nothing due. Rated questions come back here when they&apos;re due for another try." : "No questions match these filters."}
        </p>
      ) : (
        <ol className="space-y-3">
          {shown.map((item) => (
            <QuestionCard key={item.id} item={item} />
          ))}
        </ol>
      )}
    </div>
  );
}

function QuestionCard({ item }: { item: BankItem }) {
  const srs = useQuestionSrs();
  const card = srs[item.id];
  const anchor = item.id.replace("/", "--");
  // A card that a deep link points at starts open.
  const linked = useUrl().hash === `#${anchor}`;
  const [toggled, setOpen] = useState<boolean | null>(null);
  const open = toggled ?? linked;
  const [revealed, setRevealed] = useState(false);
  const [justRated, setJustRated] = useState<string | null>(null);

  const today = dayNumber();
  const status = !card ? null : isDue(card, today) ? "Due" : `Next in ${card.due - today}d`;

  return (
    <li id={anchor} className="scroll-mt-24 rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-2xl p-4 text-left sm:p-5"
      >
        <span aria-hidden className={`mt-0.5 text-ink-400 transition-transform ${open ? "rotate-90" : ""}`}>
          ▸
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block text-[17px] leading-snug font-semibold text-balance">{item.question}</span>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge>{item.trackTitle}</Badge>
            <Badge tone="brand">{item.roundLabel}</Badge>
            <LevelBadge level={item.level} />
            {status && <Badge tone={status === "Due" ? "amber" : "emerald"}>{status}</Badge>}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-100 px-4 pt-4 pb-5 sm:px-5 dark:border-ink-800">
          {!revealed ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-ink-600 dark:text-ink-400">
                Take a minute: answer out loud, or jot your key points, as if the interviewer just asked.
              </p>
              <button onClick={() => setRevealed(true)} className={buttonClass("brand", "sm", "sm:ml-auto")}>
                Reveal model answer
              </button>
            </div>
          ) : (
            <>
              <div className="prose prose-stone prose-sm max-w-none dark:prose-invert prose-h3:mt-6 prose-h3:text-xs prose-h3:font-semibold prose-h3:tracking-wider prose-h3:text-ink-500 prose-h3:uppercase prose-a:text-brand-700 dark:prose-a:text-brand-300">
                {item.answer}
              </div>
              {item.lessons.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-500">Learn it properly:</span>
                  {item.lessons.map((l) => (
                    <Link key={l.href} href={l.href} className="rounded-full border border-ink-200 px-2.5 py-0.5 hover:border-brand-400 hover:text-brand-700 dark:border-ink-700 dark:hover:text-brand-300">
                      {l.title}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-5 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50">
                <div className="mb-2 text-xs font-medium text-ink-500">How did your answer compare?</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ANSWER_RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        rateQuestion(item.id, r.rating);
                        setJustRated(previewInterval(card, r.rating));
                        setRevealed(false);
                        setOpen(false);
                      }}
                      className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900"
                    >
                      {r.label}
                      <span className="ml-1.5 text-xs font-normal text-ink-400">{previewInterval(card, r.rating)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {justRated && !open && (
        <p className="-mt-2 px-5 pb-3 text-xs text-emerald-700 dark:text-emerald-400">
          Saved. {justRated === "now" ? "It's back in your due list." : `It'll be due again in ${justRated}.`}
        </p>
      )}
    </li>
  );
}
