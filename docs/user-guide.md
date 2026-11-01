---
title: User guide
description: How to get the most out of First Principles, from your first lesson to a daily review habit.
---

First Principles is a self-paced course in backend engineering, system design, AI-native engineering and career growth. It has 12 tracks and 130 lessons. This guide covers how the platform works and how to study with it.

## The five-minute version

1. **Pick a starting point.** New to backend? Start with **Foundations**. Otherwise jump to any track from the roadmap on the home page.
2. **Read a lesson, then mark it complete.** The button at the bottom of every lesson adds it to your progress and to your review deck.
3. **Come back for Review.** The number next to **Review** in the header is how many lessons are due for recall today. Clearing it takes a few minutes.
4. **Use Practice to find gaps.** It mixes quiz questions from across the course and remembers the ones you get wrong.
5. **Check Progress** to see your streak, your accuracy per track and what's left.

## Finding your way around

### The roadmap

The home page shows the course as **four stages**:

| Stage | Tracks | What you get |
|---|---|---|
| 1 · Foundations | Foundations, Backend from First Principles | How a request travels and what every part of a backend does |
| 2 · Core | Data, Scaling Building Blocks, Low-Level Design | Storage, the building blocks of system design, clean code |
| 3 · Scale | Distributed Systems, High-Level Design, Cloud & Infrastructure, Reliability, Security | Designing, shipping and running systems at scale |
| 4 · Beyond | AI-Native Engineering, Career Ladder | Building with AI and growing from junior to tech lead |

Later stages assume the earlier ones, but every track stands on its own. Each track card shows a progress ring (not started, in progress or complete) and how much reading it holds.

The **Continue learning** card at the top of the home page always points to your next unfinished lesson. It prefers tracks you've already started.

### Track pages

A track page lists its lessons in order, grouped into sections where that helps. Each row shows the reading time and a level badge:

- **Beginner**: no prior knowledge assumed.
- **Intermediate**: assumes the earlier lessons in the track.
- **Advanced**: senior-level depth, tradeoffs and failure modes.
- **Leadership**: how tech leads and staff engineers think about the topic.

The **Start track** / **Continue track** button takes you to the first lesson you haven't completed.

### Search

Press `/` (or `⌘K` / `Ctrl+K`) anywhere to jump to the search box. Search matches lesson titles, descriptions and track names. Use `↑` `↓` to move and `Enter` to open.

## Reading a lesson

Every lesson follows the same shape, so you always know where you are:

- **The problem**: the pain that made this concept necessary. Read this first even if you think you know the topic.
- **Mental model**: an everyday analogy to hang the details on.
- **The explanation**, with code samples and diagrams.
- **Interactive simulators** in many lessons. They let you change the inputs (threads, cache size, replicas, retry policy and so on) and see the effect. Play with them; they're often where things click.
- **Check yourself**: a multiple-choice quiz with an explanation for every answer.
- **Gives you / Costs you**: the tradeoffs, because every design choice has both.
- **How this grows with your level**: what's expected of a junior, mid, senior and tech lead engineer on this topic.
- **Senior lens**: how experienced engineers and interviewers think about it.
- **Key takeaways**: the few things to remember. These become your review cards.
- **Go deeper**: hand-picked books, talks and articles.

Career lessons also include **Scenarios**: realistic workplace situations where you pick a response and see how each choice plays out.

On wide screens, the left sidebar lists every lesson in the track and the right sidebar ("On this page") follows you as you scroll. On phones, open **All lessons in …** under the lesson title. The thin bar under the header shows how far through the lesson you are.

When you finish, use **Complete & continue** to mark the lesson done and go straight to the next one. You can undo a completion at any time.

## Review: remember what you read

Reading something once is the fastest way to forget it. **Review** uses *spaced repetition*: it asks you to recall a lesson just before you'd otherwise forget it, and it spaces those reminders further apart each time you succeed.

How it works:

1. Completing a lesson adds it to your deck as a **new** card.
2. Open **Review** and press **Start review**. For each card, try to explain the lesson's key ideas out loud, as if teaching a teammate.
3. Reveal the key takeaways (`Space`) and rate yourself honestly:

| Rating | Key | When to use it | Next review |
|---|---|---|---|
| Forgot | `1` | You couldn't recall the main ideas | Again in this session |
| Hard | `2` | You got there, with effort or gaps | Slightly later than last time |
| Good | `3` | You recalled it well | Further out (1 day, 3 days, then growing) |
| Easy | `4` | Effortless | Much further out |

Each button shows when the card would come back. A session introduces at most 10 new cards, so a big backlog stays manageable.

Want to cram instead? **Browse all** shows every lesson's takeaways in a shuffled deck, with filters by track and an "only completed" option. It doesn't affect your schedule.

## Practice: quiz across the whole course

**Practice** gathers all 112 quiz questions in one place. Pick:

- **From**: all tracks, only lessons you've completed, or a single track.
- **Questions**: *Mixed* (random), *Weak spots* (questions you got wrong last time) or *Unseen* (never attempted).
- **Length**: 5, 10 or 20 questions.

Answer with the mouse or the number keys, and press `Enter` for the next question. At the end you get your score and a list of the questions you missed, each linked to its lesson.

Quizzes you answer inside lessons count too. Only your **first** attempt at an in-lesson quiz is recorded; "Try again" is for practice.

## Progress: see how you're doing

The **Progress** page shows:

- **Lessons completed** out of the total.
- **Streak**: consecutive days with any activity (completing a lesson, answering a quiz or reviewing a card). Today's streak stays alive until midnight.
- **Quiz accuracy** across every answer you've given.
- **Ready to review**: cards waiting in your deck.
- An **activity heatmap** of the last 20 weeks. Hover a square for the date and count.
- A **per-track table** of completion and quiz accuracy, which is a quick way to find your weakest area.

## Career self-assessment

Under **Career Ladder → Self-Assessment and Growth Plan**, rate yourself from Junior to Lead across 12 competencies, such as system design, production ownership and written communication. Choose a target level and the tool lists your gaps, each linked to the lesson that helps close it. Retake it every quarter.

## About the content

The lessons were written with AI assistance (Claude) and then **fact-checked** against primary sources: official documentation, specifications, standards, and the original papers and books. Every lesson was reviewed in November 2026, and new or substantially changed lessons are reviewed before they're marked as checked.

Each lesson shows its status under the title:

- **✓ Fact-checked (month)**: its specific claims (numbers, defaults, protocol details, product behavior) were checked against sources on that date, and its *Go deeper* references link to the real pages.
- **Not yet fact-checked**: the explanation is likely sound, but treat specific details as unverified until you've confirmed them in the linked docs.

Fast-moving topics (AI tooling, cloud services, specs like MCP) change after review, so the date matters. When a lesson and an official source disagree, trust the source.

## Your data and privacy

There is no account and no server. **Everything you do is stored only in this browser** (in `localStorage`): completed lessons, review schedule, quiz history, activity, self-assessment answers and your theme.

This means:

- Your progress is private: nothing leaves your device.
- Clearing site data, or using a private window, starts you fresh.
- Another browser or device won't see your progress unless you move it.

To move or protect your progress, go to **Progress → Your data**:

- **Download backup** saves everything to a `.json` file.
- **Restore from file** loads a backup, replacing what's in this browser.
- **Reset everything** erases all progress in this browser (your theme is kept).

## Keyboard shortcuts

| Where | Keys | Action |
|---|---|---|
| Anywhere | `/` or `⌘K` / `Ctrl+K` | Search lessons |
| Search | `↑` `↓`, `Enter`, `Esc` | Move, open, close |
| Review | `Space` or `Enter` | Reveal takeaways |
| Review | `1` `2` `3` `4` | Forgot / Hard / Good / Easy |
| Practice | `1`–`4` | Pick an answer |
| Practice | `Enter`, `Space` or `→` | Next question |
| Header | Menu button (phones) | Open navigation |

## A suggested routine

- **Daily, 10–15 minutes:** clear your Review queue, then read one lesson.
- **Weekly:** one Practice round on *Weak spots*, and one on a track you finished a while ago.
- **Monthly:** glance at Progress to spot a neglected track. Download a backup while you're there.
- **Quarterly:** retake the career self-assessment and pick the next two competencies to grow.

## FAQ

**My progress disappeared.** It's tied to this browser and this site address. Check you're not in a private window and haven't cleared site data. If you downloaded a backup, restore it from the Progress page.

**Can I un-complete a lesson?** Yes: press **Undo** at the bottom of the lesson. If you've already reviewed it, its card stays in your review deck.

**The review count seems high.** Every completed lesson starts as a new card, but each session only introduces 10 new ones. Rate honestly, and the queue settles into a few cards a day.

**Do I have to follow the order?** No. The order is a recommendation. If a lesson leans on something you haven't seen, use search to find the lesson that covers it.
