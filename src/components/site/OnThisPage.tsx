"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content";

/** Right-rail outline that highlights the section currently in view. */
export function OnThisPage({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    const onScroll = () => {
      // The active section is the last heading above a line just under the sticky header.
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 120) current = el.id;
        else break;
      }
      setActive(current ?? els[0]?.id ?? null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">On this page</div>
      <ul className="space-y-1 border-l border-slate-200 dark:border-slate-800">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l py-0.5 transition ${h.depth === 3 ? "pl-6" : "pl-3"} ${
                active === h.id
                  ? "border-brand-500 font-medium text-brand-700 dark:border-brand-400 dark:text-brand-300"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Thin bar under the header showing how far through the lesson you've scrolled. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-14 z-20 h-0.5" aria-hidden>
      <div className="h-full bg-gradient-to-r from-brand-500 to-sky-400 transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  );
}
