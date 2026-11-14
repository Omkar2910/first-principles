import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { tracks } from "./tracks";
import type { Level } from "./content";

/**
 * Interview questions live in `content/interview/<track>.md`. Each `## ` heading is one question,
 * followed by a meta line and the model answer in markdown:
 *
 *   ## Why are stateless services easier to scale?
 *   > round: concepts | level: mid | lessons: scaling/stateless-and-stateful-services
 *
 *   Model answer…
 *
 *   ### A strong answer covers
 *   - …
 *   ### Likely follow-ups
 *   - …
 */

const DIR = path.join(process.cwd(), "content", "interview");

export const ROUNDS = {
  concepts: "Concepts",
  hld: "System design",
  lld: "Low-level design",
  behavioral: "Behavioral",
} as const;
export type Round = keyof typeof ROUNDS;

export type InterviewQuestion = {
  id: string;
  track: string;
  question: string;
  round: Round;
  level: Level;
  /** `track/slug` of lessons that teach the answer. */
  lessons: string[];
  /** Model answer as markdown (the meta line stripped). */
  body: string;
};

function parseMeta(line: string) {
  const out: Record<string, string> = {};
  for (const part of line.replace(/^>\s*/, "").split("|")) {
    const i = part.indexOf(":");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export function getInterviewQuestions(track: string): InterviewQuestion[] {
  const file = path.join(DIR, `${track}.md`);
  if (!fs.existsSync(file)) return [];
  const slugger = new GithubSlugger();
  return fs
    .readFileSync(file, "utf-8")
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const [question, metaLine, ...rest] = chunk.split("\n");
      if (!metaLine?.startsWith(">")) throw new Error(`Interview question "${question}" in ${track}.md is missing its meta line`);
      const meta = parseMeta(metaLine);
      if (!(meta.round in ROUNDS)) throw new Error(`Unknown round "${meta.round}" for "${question}"`);
      return {
        id: `${track}/${slugger.slug(question)}`,
        track,
        question: question.trim(),
        round: meta.round as Round,
        level: (meta.level ?? "mid") as Level,
        lessons: (meta.lessons ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        body: rest.join("\n").trim(),
      };
    });
}

/** Every interview question, in roadmap order. */
export function getAllInterviewQuestions(): InterviewQuestion[] {
  return tracks.flatMap((t) => getInterviewQuestions(t.slug));
}
