import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/site/client";
import { MobileMenu, NavLinks } from "@/components/site/Nav";
import { SearchBox } from "@/components/site/SearchBox";
import { getAllLessons } from "@/lib/content";
import { getTrack } from "@/lib/tracks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "First Principles Engineering",
  description: "Backend, system design and engineering growth, from first principles to tech lead.",
};

// Applies the saved/system theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("fp:theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const searchIndex = getAllLessons().map((l) => ({
    href: `/tracks/${l.track}/${l.slug}`,
    title: l.title,
    description: l.description,
    track: getTrack(l.track)?.title ?? l.track,
  }));
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
              <Logo />
              <span className="hidden sm:inline">First Principles</span>
            </Link>
            <NavLinks />
            <div className="ml-auto flex flex-1 items-center justify-end gap-2">
              <SearchBox items={searchIndex} />
              <ThemeToggle />
              <MobileMenu />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="mt-24 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Logo size={22} /> First Principles
              </div>
              <p className="mt-2">Backend, system design and engineering growth, from how a request travels to leading a team.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
              <Link href="/#roadmap" className="hover:text-slate-900 dark:hover:text-white">Roadmap</Link>
              <Link href="/review" className="hover:text-slate-900 dark:hover:text-white">Review</Link>
              <Link href="/practice" className="hover:text-slate-900 dark:hover:text-white">Practice</Link>
              <Link href="/progress" className="hover:text-slate-900 dark:hover:text-white">Progress</Link>
              <Link href="/guide" className="hover:text-slate-900 dark:hover:text-white">User guide</Link>
              <Link href="/tracks/career-ladder/self-assessment" className="hover:text-slate-900 dark:hover:text-white">Self-assessment</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

/** Three stacked layers: build up from the foundations. */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <rect width="28" height="28" rx="7" className="fill-slate-900 dark:fill-white" />
      <rect x="6" y="17" width="16" height="4" rx="1.5" className="fill-brand-400 dark:fill-brand-600" />
      <rect x="8.5" y="11.5" width="11" height="4" rx="1.5" className="fill-white/80 dark:fill-slate-900/70" />
      <rect x="11" y="6" width="6" height="4" rx="1.5" className="fill-white/50 dark:fill-slate-900/40" />
    </svg>
  );
}
