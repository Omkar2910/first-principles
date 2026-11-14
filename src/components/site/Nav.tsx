"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DueBadge } from "./client";

export const NAV = [
  { href: "/#roadmap", match: "/tracks", label: "Roadmap" },
  { href: "/review", match: "/review", label: "Review", badge: true },
  { href: "/practice", match: "/practice", label: "Practice" },
  { href: "/interview", match: "/interview", label: "Interview" },
  { href: "/progress", match: "/progress", label: "Progress" },
  { href: "/guide", match: "/guide", label: "Guide" },
];

function useIsActive() {
  const pathname = usePathname();
  return (match: string) => pathname.startsWith(match);
}

export function NavLinks() {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {NAV.map((n) => {
        const active = isActive(n.match);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center rounded-md px-2.5 py-1.5 transition-colors ${
              active
                ? "font-medium text-ink-900 dark:text-white"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800/70 dark:hover:text-white"
            }`}
          >
            {n.label}
            {n.badge && <DueBadge />}
            {active && <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-brand-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Hamburger menu for small screens. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();

  // Close on navigation (render-time reset avoids an effect + extra render).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          {open ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />}
        </svg>
      </button>
      {open && <div className="fixed inset-0 top-14 bg-ink-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />}
      {open && (
        <div className="absolute inset-x-0 top-14 border-b border-ink-200 bg-white px-4 py-3 shadow-lg dark:border-ink-800 dark:bg-ink-950">
          <nav className="flex flex-col">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center rounded-lg px-3 py-2.5 ${
                  isActive(n.match) ? "bg-ink-100 font-medium dark:bg-ink-800" : "text-ink-600 dark:text-ink-300"
                }`}
              >
                {n.label}
                {n.badge && <DueBadge />}
              </Link>
            ))}
            <Link href="/tracks/career-ladder/self-assessment" className="rounded-lg px-3 py-2.5 text-ink-600 dark:text-ink-300">
              Self-assessment
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
