"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "@/components/ui";

export type SearchItem = { href: string; title: string; description: string; track: string };

export function SearchBox({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // "/" or Cmd/Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items
      .map((it) => {
        const title = it.title.toLowerCase();
        const hay = `${title} ${it.description.toLowerCase()} ${it.track.toLowerCase()}`;
        if (!terms.every((t) => hay.includes(t))) return null;
        const score = terms.reduce((s, t) => s + (title.includes(t) ? 2 : 1), 0);
        return { it, score };
      })
      .filter((x): x is { it: SearchItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.it);
  }, [q, items]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  };

  return (
    <div className="relative w-full max-w-64">
      <svg
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" />
      </svg>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && results[active]) go(results[active].href);
          if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
        placeholder="Search lessons"
        aria-label="Search lessons"
        className="peer h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-8 text-sm outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-3 focus:ring-brand-500/15 dark:border-slate-700/80 dark:bg-slate-900 dark:focus:bg-slate-950"
      />
      <Kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 peer-focus:hidden sm:inline-flex">/</Kbd>
      {open && q && (
        <div className="fixed inset-x-4 top-14 z-40 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:w-[26rem] dark:border-slate-700 dark:bg-slate-900">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No lessons match &ldquo;{q}&rdquo;</div>
          ) : (
            <div className="p-1.5">
              {results.map((r, i) => (
                <button
                  key={r.href}
                  onMouseDown={(e) => { e.preventDefault(); go(r.href); }}
                  onMouseEnter={() => setActive(i)}
                  className={`block w-full rounded-lg px-3 py-2 text-left ${i === active ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
                >
                  <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400">{r.track}</div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="truncate text-xs text-slate-500">{r.description}</div>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
            <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
          </div>
        </div>
      )}
    </div>
  );
}
