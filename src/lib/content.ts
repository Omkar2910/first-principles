import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { tracks } from "./tracks";

const CONTENT_DIR = path.join(process.cwd(), "content");
const DOCS_DIR = path.join(process.cwd(), "docs");

export type Level = "junior" | "mid" | "senior" | "lead";

export type LessonMeta = {
  track: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  minutes: number;
  level: Level;
  /** Optional grouping label shown on the track page. */
  section?: string;
  /** ISO date the lesson was last fact-checked against sources; absent = not yet reviewed. */
  reviewed?: string;
};

/** Minimal frontmatter parser: flat `key: value` pairs between `---` fences. */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    data[key] = value;
  }
  return { data, body: match[2] };
}

function lessonFiles(track: string): string[] {
  const dir = path.join(CONTENT_DIR, track);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
}

/** Files are named `NN-slug.mdx`; the number sets the order. */
function metaFromFile(track: string, file: string): LessonMeta {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, track, file), "utf-8");
  const { data } = parseFrontmatter(raw);
  const [, num, slug] = file.match(/^(\d+)-(.+)\.mdx$/) ?? [];
  return {
    track,
    slug,
    order: Number(num),
    title: data.title ?? slug,
    description: data.description ?? "",
    minutes: Number(data.minutes ?? 10),
    level: (data.level as Level) ?? "junior",
    section: data.section,
    reviewed: data.reviewed,
  };
}

export function getLessons(track: string): LessonMeta[] {
  return lessonFiles(track)
    .map((f) => metaFromFile(track, f))
    .sort((a, b) => a.order - b.order);
}

export function getLesson(track: string, slug: string) {
  const file = lessonFiles(track).find((f) => f.replace(/^\d+-/, "").replace(/\.mdx$/, "") === slug);
  if (!file) return null;
  const raw = fs.readFileSync(path.join(CONTENT_DIR, track, file), "utf-8");
  return { meta: metaFromFile(track, file), body: parseFrontmatter(raw).body };
}

export function getAllLessonParams() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((d) => fs.statSync(path.join(CONTENT_DIR, d)).isDirectory())
    .flatMap((track) => getLessons(track).map((l) => ({ track, lesson: l.slug })));
}

/** Every lesson, in roadmap order (track number, then lesson order). */
export function getAllLessons(): LessonMeta[] {
  return tracks.flatMap((t) => getLessons(t.slug));
}

/** Bullet points inside a lesson's <KeyTakeaways> block, used for review cards. */
export function getTakeaways(track: string, slug: string): string[] {
  const body = getLesson(track, slug)?.body ?? "";
  const block = body.match(/<KeyTakeaways>([\s\S]*?)<\/KeyTakeaways>/)?.[1] ?? "";
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) =>
      l
        .slice(2)
        .replace(/\*\*/g, "")
        .replace(/\*([^*\s][^*]*)\*/g, "$1")
        .replace(/`/g, ""),
    );
}

/** Consecutive lessons sharing a `section` frontmatter value, in order. */
export function groupBySection(lessons: LessonMeta[]) {
  const groups: { section?: string; lessons: LessonMeta[] }[] = [];
  for (const l of lessons) {
    const last = groups[groups.length - 1];
    if (last && last.section === l.section) last.lessons.push(l);
    else groups.push({ section: l.section, lessons: [l] });
  }
  return groups;
}

/** A markdown page from `docs/`, so in-app pages and repo docs share one source. */
export function getDoc(name: string) {
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(DOCS_DIR, `${name}.md`), "utf-8"));
  return { title: data.title ?? name, description: data.description ?? "", body };
}

/* ---------- Headings (for the "On this page" outline) ---------- */

export type Heading = { depth: 2 | 3; text: string; id: string };

/** `##`/`###` headings outside code fences, with the same ids rehype-slug assigns. */
export function getHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    // Strip inline markdown so the slug matches the rendered text.
    const text = m[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`*_]/g, "")
      .trim();
    headings.push({ depth: m[1].length as 2 | 3, text, id: slugger.slug(text) });
  }
  return headings;
}

/* ---------- Quizzes (for practice mode and stats) ---------- */

export type QuizItem = {
  track: string;
  slug: string;
  lessonTitle: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** Reads `name="..."` and `name={expr}` JSX attributes. Expressions are evaluated: lessons are trusted content. */
function parseJsxAttributes(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let i = 0;
  while (i < src.length) {
    const m = /([A-Za-z]+)\s*=\s*/y;
    m.lastIndex = i;
    const hit = m.exec(src);
    if (!hit) {
      i++;
      continue;
    }
    const name = hit[1];
    i = m.lastIndex;
    if (src[i] === '"' || src[i] === "'") {
      const end = src.indexOf(src[i], i + 1);
      out[name] = src.slice(i + 1, end);
      i = end + 1;
    } else if (src[i] === "{") {
      // Find the matching brace, skipping over string literals.
      let depth = 0;
      let j = i;
      let quote: string | null = null;
      for (; j < src.length; j++) {
        const c = src[j];
        if (quote) {
          if (c === "\\") j++;
          else if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === "`") quote = c;
        else if (c === "{") depth++;
        else if (c === "}" && --depth === 0) break;
      }
      out[name] = new Function(`return (${src.slice(i + 1, j)});`)();
      i = j + 1;
    }
  }
  return out;
}

export function getQuizzes(track: string, slug: string): QuizItem[] {
  const lesson = getLesson(track, slug);
  if (!lesson) return [];
  return [...lesson.body.matchAll(/<Quiz\b([\s\S]*?)\/>/g)].map((m) => {
    const a = parseJsxAttributes(m[1]);
    return {
      track,
      slug,
      lessonTitle: lesson.meta.title,
      question: String(a.question),
      options: a.options as string[],
      answer: Number(a.answer),
      explanation: String(a.explanation ?? ""),
    };
  });
}

/** Every quiz in the course, in roadmap order. */
export function getAllQuizzes(): QuizItem[] {
  return getAllLessons().flatMap((l) => getQuizzes(l.track, l.slug));
}
