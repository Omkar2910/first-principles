# Overview: what First Principles is and why

## Purpose

First Principles is a learning platform for software engineers who want to understand backend systems **from the ground up**, and to grow from junior engineer to tech lead along the way.

Most engineering material falls into one of two traps:

- **Tutorials** teach *how* to use a tool (here's how to add Redis) without the *why* (what problem caching solves, what it costs you, when it's the wrong answer).
- **Reference material and interview prep** list facts and patterns to memorize, so they're forgotten a week later and can't be applied to a problem that looks slightly different.

First Principles takes the opposite approach. Every concept starts with **the problem that made it necessary**, builds a **mental model**, explains the mechanism, and then makes you **use** the idea through simulators, quizzes, scenarios and spaced review.

## Who it's for

- **Early-career engineers** who can write code but want to understand what happens underneath it: networks, databases, concurrency, the request lifecycle.
- **Mid-level engineers** preparing for system design work or interviews, who need a repeatable way to reason about scale, consistency and failure.
- **Senior engineers and aspiring tech leads** who want a structured view of the non-coding skills (design docs, influence, leading projects, growing people) and of AI-native engineering.

## What's in it

**12 tracks · 131 lessons · 115 quizzes · 19 interactive simulators**, arranged in four stages:

| Stage | Tracks |
|---|---|
| 1 · Foundations | Foundations (OS, networking, HTTP, TLS) · Backend from First Principles |
| 2 · Core | Data · Scaling Building Blocks · Low-Level Design |
| 3 · Scale | Distributed Systems · High-Level Design · Cloud & Infrastructure · Reliability & Operations · Security |
| 4 · Beyond | AI-Native Engineering · Career Ladder |

Code examples are Java-flavored (Spring) where a language matters, but the ideas are language-agnostic.

## The teaching approach

### 1. Problem first

Each lesson opens with a **Problem** block: a concrete situation where the naive approach breaks. You can't appreciate a write-ahead log until you've imagined a crash halfway through writing a file.

### 2. A mental model before the details

A short analogy (a **Mental Model** block) gives the reader somewhere to hang the details. An accountant's journal and ledger explains WAL and checkpoints better than a diagram of disk pages does.

### 3. Tradeoffs, always

Nothing is presented as simply good. **Gives you / Costs you** blocks state what you're paying for every technique. The recurring lesson: senior engineering is mostly choosing which costs to accept.

### 4. Learning by doing

Eighteen **simulators** turn mechanisms into toys you can poke: a thread pool under load, an LRU cache, a token bucket, a consistent-hash ring, Kafka partitions, isolation-level anomalies, a retry storm. Changing a parameter and watching the system fail teaches more than a paragraph does.

### 5. Growth by level

**How this grows with your level** blocks describe what's expected of junior, mid, senior and lead engineers on each topic. The **Senior lens** block explains how experienced engineers and interviewers think about it. Together they connect each topic to career growth, which the Career Ladder track then covers head-on.

### 6. Retrieval, not re-reading

Research on learning is consistent: **testing yourself** and **spacing practice over time** beat re-reading by a wide margin. The platform builds both in:

- **Quizzes** in lessons, plus a **Practice** mode that mixes questions across tracks and resurfaces the ones you got wrong.
- A **spaced-repetition Review** deck built from each lesson's key takeaways, scheduled by how well you recall them.
- A **Progress** dashboard with streaks and accuracy per track, to make a steady habit visible.

## Design principles for the product

- **No account, no server, no tracking.** All learner state lives in the browser. A backup file moves it between devices.
- **Static and fast.** Every page is pre-rendered at build time, and the site can be hosted on any static host or CDN.
- **Content is just files.** Lessons are MDX files in the repo. Adding a lesson means adding a file; there's no CMS.
- **One consistent lesson shape.** The same building blocks in the same order make lessons predictable to read and easy to write.

## Where to go next

- [User guide](user-guide.md): how to use the platform as a learner (also at `/guide` in the app).
- [Architecture](architecture.md): how the app is built.
- [Authoring](authoring.md): how to write lessons and build simulators.
