# Authoring guide

How to write lessons, use the lesson building blocks, and add interactive simulators. Read the [architecture doc](architecture.md) first if you're changing code rather than content.

## Adding a lesson

1. Create `content/<track-slug>/NN-lesson-slug.mdx`.
   - `NN` sets the order within the track. Renumber the following files if you insert in the middle.
   - `lesson-slug` becomes the URL: `/tracks/<track-slug>/lesson-slug`.
2. Add frontmatter:

```mdx
---
section: Optional group heading on the track page
title: The Life of a Request
description: One-line summary shown in lists, search and the lesson header.
minutes: 12
level: junior        # junior | mid | senior | lead
---
```

| Field | Required | Used for |
|---|---|---|
| `title` | yes | Page title, lists, search, review cards |
| `description` | yes | Subtitle, track list, search |
| `minutes` | yes | Reading-time badges and track totals |
| `level` | yes | Level badge (Beginner, Intermediate, Advanced, Leadership) |
| `section` | no | Groups *consecutive* lessons under a heading on the track page and sidebar |

The parser handles flat `key: value` lines only: no nesting, lists or multi-line values.

3. Run `npm run dev` and open the lesson. New files are picked up automatically, and the lesson appears in its track, in search, on the roadmap counts, and (if it has `<KeyTakeaways>` and `<Quiz>`) in Review and Practice.

## The lesson template

Keep the shape consistent; learners rely on it.

```mdx
<Problem>
The concrete pain that makes this concept necessary.
</Problem>

## First idea

Explanation, code, tables…

<MentalModel>
An everyday analogy.
</MentalModel>

## Second idea

<SomeSim />

<Quiz
  question="…"
  options={["…", "…", "…", "…"]}
  answer={1}
  explanation="Why the right answer is right, and why the tempting wrong one is wrong."
/>

<Tradeoffs good={["…", "…"]} bad={["…", "…"]} />

<LevelTags junior="…" mid="…" senior="…" lead="…" />

<SeniorLens>
How experienced engineers and interviewers think about it.
</SeniorLens>

<KeyTakeaways>
- Three to five bullets.
- Each one should stand alone, because they become review cards.
</KeyTakeaways>

<GoDeeper>
- **Resource**: why it's worth the time.
</GoDeeper>
```

## Building blocks reference

All of these are available in any lesson without importing.

| Component | Props | Notes |
|---|---|---|
| `<Problem>` | `title?`, children | Opens the lesson. Children are markdown. |
| `<MentalModel>` | `title?`, children | Analogy. |
| `<SeniorLens>` | `title?`, children | Expert and interviewer perspective. |
| `<KeyTakeaways>` | children: a markdown bullet list | **Each `- ` bullet becomes a line on the lesson's review card.** Bold and code markers are stripped for the card. |
| `<GoDeeper>` | children | Curated resources; links welcome. |
| `<Tradeoffs>` | `good: string[]`, `bad: string[]` | Two columns: "Gives you" and "Costs you". |
| `<LevelTags>` | `junior?`, `mid?`, `senior?`, `lead?` (strings) | Omitted levels are hidden. |
| `<Quiz>` | `question`, `options: string[]`, `answer` (0-based index), `explanation` | Also extracted into Practice. See the rules below. |
| `<Scenario>` | `situation`, `choices: { text, feedback, best? }[]` | Workplace judgment exercise; mark one choice `best: true`. |
| `<Flow>` | `nodes: string[]`, `labels?: string[]`, `caption?` | Left-to-right architecture strip. `labels[i]` annotates the arrow after `nodes[i]`. |
| Simulators | none | e.g. `<KafkaSim />`, `<LruCacheSim />`; the full list is in `src/components/sims/index.ts`. |

### Quiz rules

Practice mode and quiz statistics read quizzes straight from the MDX source, so:

- **Question text must be unique across the whole course.** It's the key for a learner's quiz history; changing it resets that question's history.
- Write the element as `<Quiz … />` (self-closing), with `question`, `answer` and `explanation` as plain string or number attributes and `options` as an array of string literals.
- Put the correct answer in different positions across a lesson's quizzes.
- Explanations should teach: say why the right answer is right *and* what's wrong with the most tempting distractor.

### Markdown features

- GitHub-flavored markdown: tables, strikethrough, task lists.
- Fenced code blocks are highlighted by Shiki in both themes. Add a language: ` ```java `, ` ```sql `, ` ```bash `.
- `##` and `###` headings get anchor ids and appear in the "On this page" outline. Use `##` for the main sections.
- MDX treats `<` and `{` as JSX. In prose, write `&lt;` or put the text in backticks.

## Writing style

- **Problem before solution.** Don't name a technique before the reader feels the need for it.
- **Concrete over abstract.** Use real numbers ("50 million rows", "~1 ms"), real products (Postgres, Kafka) and real failure stories.
- **Always state the cost.** If a section only lists benefits, it's not finished.
- **Short paragraphs, plain words.** Define jargon on first use.
- **Takeaways are memory hooks**, not a summary of every section: three to five bullets.

## Adding a simulator

1. Create `src/components/sims/MySim.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SimFrame, Slider, Stat } from "./ui";

export function MySim() {
  const [load, setLoad] = useState(50);
  return (
    <SimFrame title="My simulator" hint="One sentence on what to try.">
      <Slider label="Load" value={load} min={0} max={100} unit="%" onChange={setLoad} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Latency" value={`${Math.round(10 + load * load / 50)} ms`} />
      </div>
    </SimFrame>
  );
}
```

2. Export it from `src/components/sims/index.ts`. Every export there is automatically available in MDX, and the count on the home page updates.
3. Use it in a lesson: `<MySim />`.

Guidelines:

- Wrap simulators in `SimFrame` and use the helpers in `sims/ui.tsx` (`Slider`, `Segmented`, `Stat`, `Button`) so they match the rest of the app in both themes.
- Start in an interesting state, and let the reader *cause* the failure the lesson describes.
- Keep simulations deterministic enough that the lesson text's claims hold.
- If a simulator persists anything, use `createStore` from `src/lib/store.ts` with a `fp:` key so backups include it.

## Adding a track

1. Add an entry to `tracks` in `src/lib/tracks.ts` (`slug`, `number`, `title`, `tagline`, `description`, `stage`, `topics`).
2. Create `content/<slug>/` with at least one lesson. Tracks without lessons are not given a page.

## Checklist before you commit

- [ ] `npm run lint` and `npm run build` pass.
- [ ] The lesson renders in light and dark mode, and at phone width.
- [ ] Every quiz question is unique and its `answer` index is correct.
- [ ] `<KeyTakeaways>` has three to five standalone bullets.
- [ ] Code blocks have a language.
