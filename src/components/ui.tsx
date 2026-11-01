import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Shared visual primitives. Pages compose these instead of repeating long class strings. */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "brand";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white shadow-sm hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  brand: "bg-brand-600 text-white shadow-sm hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400",
  secondary:
    "border border-slate-300 bg-white text-slate-900 shadow-xs hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

/* ---------- Surfaces ---------- */

export function Card({ className, interactive, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
        interactive &&
          "transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:border-slate-700 dark:hover:shadow-none",
        className,
      )}
    />
  );
}

/* ---------- Text ---------- */

/** Small uppercase label above a heading or section. */
export function Eyebrow({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400", className)} />;
}

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-2 text-brand-600 dark:text-brand-400">{eyebrow}</Eyebrow>}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {children && <p className="mt-3 text-lg text-pretty text-slate-600 dark:text-slate-400">{children}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      {...props}
      className={cx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400",
        className,
      )}
    />
  );
}

/* ---------- Status ---------- */

type Tone = "slate" | "brand" | "emerald" | "amber" | "rose" | "sky" | "violet";

const TONES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  brand: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  amber: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
};

export function Badge({ tone = "slate", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", TONES[tone], className)}
    />
  );
}

export const LEVEL_META = {
  junior: { label: "Beginner", tone: "slate" },
  mid: { label: "Intermediate", tone: "sky" },
  senior: { label: "Advanced", tone: "violet" },
  lead: { label: "Leadership", tone: "amber" },
} as const satisfies Record<string, { label: string; tone: Tone }>;

export function LevelBadge({ level }: { level: keyof typeof LEVEL_META }) {
  const m = LEVEL_META[level];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

/* ---------- Progress ---------- */

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800", className)}
    >
      <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 40, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={4} className="fill-none stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={cx("fill-none transition-[stroke-dashoffset] duration-500", value > 0 ? "stroke-emerald-500" : "stroke-transparent")}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums">{children}</span>
    </div>
  );
}

/** Big number + label, for dashboards. */
export function StatTile({ value, sub, label, className }: { value: ReactNode; sub?: ReactNode; label: ReactNode; className?: string }) {
  return (
    <Card className={cx("h-full p-4", className)}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </Card>
  );
}

/** Pill-style segmented control. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("inline-flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800/70", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-md px-3 py-1 font-medium transition",
            o.value === value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
