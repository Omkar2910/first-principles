import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { GoDeeper, KeyTakeaways, LevelTags, MentalModel, Problem, SeniorLens, Tradeoffs } from "./lesson/blocks";
import { Quiz } from "./lesson/Quiz";
import { Flow } from "./lesson/Flow";
import { Scenario } from "./lesson/Scenario";
import * as sims from "./sims";

/** Every component a lesson can use. Add new simulators here. */
const components = {
  Problem,
  MentalModel,
  SeniorLens,
  KeyTakeaways,
  GoDeeper,
  Tradeoffs,
  LevelTags,
  Quiz,
  Flow,
  Scenario,
  ...sims,
};

export async function renderLesson(source: string) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      // Lessons are our own trusted content and pass arrays/objects as props.
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, { theme: { light: "github-light", dark: "github-dark-dimmed" }, keepBackground: false }],
        ],
      },
    },
  });
  return content;
}
