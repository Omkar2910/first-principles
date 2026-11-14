# First Principles Engineering

A personal learning platform for backend engineering, system design, AI-native engineering and career growth, from how a request travels all the way to tech lead.

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # static build of every page
npm run check:links  # verify every external link in content/ and docs/
```

## Documentation

- [Overview](docs/overview.md): purpose, audience and teaching approach
- [User guide](docs/user-guide.md): how to use the platform (also in the app at `/guide`)
- [Architecture](docs/architecture.md): how it's built
- [Authoring](docs/authoring.md): writing lessons and simulators

## What's inside

**12 tracks · 131 lessons (~117k words) · 19 interactive simulators · 66 interview questions · 12 design drills**

| # | Track | Lessons |
|---|---|---|
| 0 | Foundations: request lifecycle, processes & threads, concurrency, memory & latency, TCP/IP, DNS, HTTP, TLS, I/O models, server lifecycle | 10 |
| 1 | Backend from First Principles: routing, serialization, validation, middleware, layering, authN/authZ, API styles, errors, config & logging, jobs, testing, production readiness | 14 |
| 2 | Data: modeling, indexes, query performance, ACID, isolation levels, NoSQL, replication, sharding, migrations, choosing a DB | 11 |
| 3 | Scaling: fundamentals, stateless vs stateful services, load balancing, caching & pitfalls, CDN, queues, Kafka, rate limiting, consistent hashing, gateways/mesh | 11 |
| 4 | Distributed Systems: partial failure, CAP/PACELC, consistency, resilience patterns, idempotency, sagas, outbox/CDC, consensus, clocks, microservices | 10 |
| 5 | High-Level Design: framework, estimation + 9 case studies (URL shortener, feed, chat, notifications, payments, autocomplete, ride-hailing, video, ticketing) | 11 |
| 6 | Low-Level Design: OOP, SOLID, patterns, API design, DDD/hexagonal, parking lot, Splitwise | 9 |
| 7 | Cloud & Infrastructure: cloud basics, Linux, Docker, Kubernetes, core services, VPC networking, CI/CD, IaC, serverless & cost | 9 |
| 8 | Reliability: availability math, observability, SLOs, deployments, overload, incidents, postmortems, capacity & chaos | 8 |
| 9 | Security: threat modeling, web vulns, passwords/MFA, OAuth/OIDC, secrets & encryption, API security, supply chain & zero trust | 7 |
| 10 | AI-Native Engineering: LLMs, prompting, embeddings, RAG, agents, MCP, evals, LLM system design, LLM security, coding agents, career | 11 |
| 11 | Career Ladder: Junior → Mid → Senior → Tech Lead/Staff, self-assessment, promotions, interviews, templates | 20 |

Other features:

- **Spaced review** (`/review`): completed lessons join a review rotation. Rate your recall (Forgot / Hard / Good / Easy, keys `1`–`4`) and a simplified SM-2 scheduler decides when each card comes back. A badge in the header shows how many are due. "Browse all" keeps the old unscheduled shuffle.
- **Practice** (`/practice`): every `<Quiz>` from every lesson, extracted at build time, in mixed sessions filtered by track, with *weak spots* (last answered wrong) and *unseen* modes.
- **Progress dashboard** (`/progress`): streaks, a 20-week activity heatmap, per-track completion and quiz accuracy, plus backup download / restore / reset.
- **Lesson reading aids**: an "On this page" outline with scroll-spy, a reading progress bar, and a "next track" link at the end of each track.
- Lesson search (`/` or `⌘K`), a "continue learning" card, a career self-assessment and dark mode.

All learner state lives in the browser under `fp:*` localStorage keys (`src/lib/store.ts`): completions with dates, review schedule, quiz history and daily activity. Use the backup on `/progress` to move it between devices.

## How content works

- **Tracks** are defined in `src/lib/tracks.ts`.
- **Lessons** are MDX files at `content/<track-slug>/NN-lesson-slug.mdx`. The `NN` prefix sets the order.

```mdx
---
section: Optional group heading on the track page
title: The Life of a Request
description: One-line summary shown in lists and search.
minutes: 12
level: junior        # junior | mid | senior | lead
---
```

### Lesson building blocks

| Component | Purpose |
|---|---|
| `<Problem>` | Why the concept exists |
| `<MentalModel>` | A simple analogy |
| `<Flow nodes={[...]} />` | Simple architecture strip |
| `<Tradeoffs good={[...]} bad={[...]} />` | Gives you / costs you |
| `<LevelTags junior="" mid="" senior="" lead="" />` | How expectations grow by level |
| `<SeniorLens>` | How experienced engineers / interviewers think |
| `<Quiz question="" options={[...]} answer={0} explanation="" />` | Self-check |
| `<Scenario situation="" choices={[{text, feedback, best}]} />` | Workplace judgment exercise |
| `<KeyTakeaways>` | Bullet list; also feeds the review deck |
| `<GoDeeper>` | Curated external resources |

### Simulators

Interactive components live in `src/components/sims/` and are registered in `src/components/sims/index.ts`. Any exported component there can be used directly in MDX, for example `<KafkaSim />`, `<IsolationPlayground />` or `<EstimationCalculator />`.

## Stack

Next.js (App Router, static generation) · React · TypeScript · Tailwind CSS v4 · `next-mdx-remote` · Shiki (via `rehype-pretty-code`).
