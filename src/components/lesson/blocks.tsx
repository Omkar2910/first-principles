import type { ReactNode } from "react";

type BlockProps = { title?: string; children: ReactNode };

/* Small stroke icons, drawn on a 16px grid. */
const ICONS = {
  problem: <path d="M8 2.5L14 13H2L8 2.5zM8 6.5v3M8 11.2v.1" />,
  model: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  senior: <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4L2.2 6.3l4-.6L8 2z" />,
  takeaways: <path d="M3 8.5l3 3 7-7" />,
  deeper: <path d="M5 11l6-6M6 5h5v5" />,
};

/**
 * A callout inside lesson prose. It deliberately stays inside the article's `prose` scope
 * (no `not-prose`), so lists, links and code in the children keep their typography.
 */
function Block({
  label,
  icon,
  tone,
  chip,
  marker,
  title,
  children,
}: BlockProps & { label: string; icon: keyof typeof ICONS; tone: string; chip: string; marker: string }) {
  return (
    <section className={`my-8 rounded-2xl border p-5 sm:p-6 ${tone}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chip}`} aria-hidden>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {ICONS[icon]}
          </svg>
        </span>
        <span className="text-xs font-semibold tracking-wider uppercase opacity-80">{label}</span>
      </div>
      {title && <div className="mb-2 text-lg font-semibold">{title}</div>}
      <div className={`text-[0.95em] [&_li]:my-1 [&_p]:my-2 [&_ul]:my-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0 ${marker}`}>{children}</div>
    </section>
  );
}

/** Opens a lesson: the pain that made this concept necessary. */
export function Problem(props: BlockProps) {
  return (
    <Block
      label="The problem"
      icon="problem"
      tone="border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/[0.06]"
      chip="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      marker="[&_li]:marker:text-amber-500"
      {...props}
    />
  );
}

/** A simple analogy to hang the details on. */
export function MentalModel(props: BlockProps) {
  return (
    <Block
      label="Mental model"
      icon="model"
      tone="border-sky-200 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-500/[0.06]"
      chip="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
      marker="[&_li]:marker:text-sky-500"
      {...props}
    />
  );
}

/** How experienced engineers think about this, and what interviewers probe. */
export function SeniorLens(props: BlockProps) {
  return (
    <Block
      label="Senior lens"
      icon="senior"
      tone="border-violet-200 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/[0.06]"
      chip="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      marker="[&_li]:marker:text-violet-500"
      {...props}
    />
  );
}

export function KeyTakeaways(props: BlockProps) {
  return (
    <Block
      label="Key takeaways"
      icon="takeaways"
      tone="border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]"
      chip="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      marker="[&_li]:marker:text-emerald-500"
      {...props}
    />
  );
}

export function GoDeeper(props: BlockProps) {
  return (
    <Block
      label="Go deeper"
      icon="deeper"
      tone="border-ink-200 bg-ink-50/70 dark:border-ink-700/70 dark:bg-ink-800/30"
      chip="bg-ink-200/70 text-ink-700 dark:bg-ink-700/60 dark:text-ink-300"
      marker="[&_li]:marker:text-ink-400"
      {...props}
    />
  );
}

export function Tradeoffs({ good, bad }: { good: string[]; bad: string[] }) {
  const column = (title: string, items: string[], sign: string, tone: string, signTone: string) => (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="mb-3 text-xs font-semibold tracking-wider uppercase">{title}</div>
      <ul className="space-y-2 text-sm text-ink-700 dark:text-ink-300">
        {items.map((g) => (
          <li key={g} className="flex gap-2.5">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none font-bold ${signTone}`} aria-hidden>
              {sign}
            </span>
            {g}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="not-prose my-8 grid gap-4 sm:grid-cols-2">
      {column(
        "Gives you",
        good,
        "+",
        "border-emerald-200 text-emerald-700 dark:border-emerald-500/25 dark:text-emerald-400",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      )}
      {column(
        "Costs you",
        bad,
        "−",
        "border-rose-200 text-rose-700 dark:border-rose-500/25 dark:text-rose-400",
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      )}
    </section>
  );
}

const LEVELS = [
  { key: "junior", label: "Junior", bar: "w-1/4", tone: "bg-ink-400 dark:bg-ink-500" },
  { key: "mid", label: "Mid", bar: "w-2/4", tone: "bg-sky-500" },
  { key: "senior", label: "Senior", bar: "w-3/4", tone: "bg-violet-500" },
  { key: "lead", label: "Tech Lead", bar: "w-full", tone: "bg-amber-500" },
] as const;

/** How the expectation around this topic grows with seniority: a small ladder, one rung per level. */
export function LevelTags(props: Partial<Record<(typeof LEVELS)[number]["key"], string>>) {
  return (
    <section className="not-prose my-8 rounded-2xl border border-ink-200 p-5 sm:p-6 dark:border-ink-800">
      <div className="mb-4 text-xs font-semibold tracking-wider text-ink-500 uppercase">How this grows with your level</div>
      <dl className="space-y-4">
        {LEVELS.filter((l) => props[l.key]).map((l) => (
          <div key={l.key} className="grid gap-1.5 sm:grid-cols-[7rem_1fr] sm:gap-4">
            <dt className="pt-0.5">
              <div className="text-xs font-semibold">{l.label}</div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-ink-100 dark:bg-ink-800">
                <div className={`h-full rounded-full ${l.bar} ${l.tone}`} />
              </div>
            </dt>
            <dd className="text-sm text-ink-700 dark:text-ink-300">{props[l.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
