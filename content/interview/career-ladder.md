## Tell me about a project you led from start to finish.
> round: behavioral | level: senior | lessons: career-ladder/interviews-by-level, career-ladder/leading-projects

**What they're assessing**: scope, ownership, and whether you delivered *through* others, not just your own code.

**Structure (STAR)**, emphasizing your own actions:

- **Situation**: the business problem and why it mattered, in one or two sentences.
- **Task**: your role and what "done" meant.
- **Action**: how you broke the work down and de-risked the unknowns first, decisions you made and the trade-offs, how you handled dependencies and slipping dates, how you kept stakeholders informed.
- **Result**: measurable outcomes (latency, revenue, incidents, time saved), plus what you learned.

**Senior signals**: "I" for your actions (not just "we"), scope beyond your own tasks, explicit trade-offs, data, and reflection on what you'd do differently.

**Pitfalls**: a feature list with no stakes; no numbers; no setbacks (every real project has one).

### A strong answer covers
- Clear stakes and your specific role
- Planning, de-risking and handling a setback
- Measurable results
- A lesson you applied later

### Likely follow-ups
- What would you do differently?
- How did you handle a dependency on another team that slipped?

## Tell me about a time you disagreed with a technical decision.
> round: behavioral | level: mid | lessons: career-ladder/design-docs-and-tradeoffs, career-ladder/cross-team-influence, career-ladder/decision-making

**What they're assessing**: whether you can disagree with evidence and respect, and then commit.

**A good story shows**:

- The disagreement was about **trade-offs**, not people, and you understood the other side's goals.
- You made your case with **data**: a prototype, a benchmark, a written comparison of options.
- You chose the right forum (a 1:1 first, then a design review), not a public fight.
- How it was **decided** and that you **disagreed and committed** if it didn't go your way, or brought others along if it did.
- What happened afterwards, and what you learned about influence.

**Pitfalls**: a story where you were simply right and everyone else was wrong; no resolution; disrespect for colleagues.

### A strong answer covers
- Trade-off framing and empathy for the other view
- Evidence over opinion
- A clear decision and disagree-and-commit
- Outcome and reflection

### Likely follow-ups
- What if you had been wrong?

## Tell me about a mistake you made in production.
> round: behavioral | level: mid | lessons: career-ladder/owning-production, reliability/postmortems, reliability/incident-response

**What they're assessing**: ownership, honesty, and whether you turn failures into improvements.

**A good story**:

- A real mistake with real impact, owned plainly ("I deployed a migration that locked the orders table").
- What you did **in the moment**: noticed, communicated, mitigated (rolled back first).
- What you did **after**: a blameless postmortem, and concrete changes to the system so it couldn't happen the same way again (a check in CI, a runbook, an alert), not just "I'll be more careful".
- What you learned and how your behaviour changed.

**Pitfalls**: a fake weakness, blaming others or tools, or a story with no systemic fix.

### A strong answer covers
- Plain ownership of the mistake
- Fast mitigation and communication
- A systemic fix, not a promise to try harder
- Genuine reflection

### Likely follow-ups
- How did you communicate it to stakeholders?

## How have you helped other engineers grow?
> round: behavioral | level: senior | lessons: career-ladder/multiplying-others, career-ladder/delegation-and-growing-people

**What they're assessing**: senior impact is your output **plus** how much better you make the people around you.

**Evidence to bring**:

- **Mentoring** someone specific: how you helped (asking questions rather than handing over answers, stretch assignments, sponsoring them for visible work) and how they grew.
- **Code reviews** that teach: prioritized, explaining why, timely.
- **Scaling knowledge**: docs, talks, templates or tooling that raised the whole team's level.
- **Delegation**: giving real ownership with context and check-ins, rather than keeping the interesting work.

Make it concrete: one person, what changed for them, and the result for the team.

### A strong answer covers
- A specific person and their growth
- Teaching through questions, stretch and sponsorship
- Something that scaled beyond one person
- Measurable team impact

### Likely follow-ups
- Tell me about someone you mentored who struggled.

## How do you balance technical debt against feature work?
> round: behavioral | level: senior | lessons: career-ladder/tech-debt-and-code-health, career-ladder/communicating-with-leadership

**What they're assessing**: judgment, and whether you can make engineering concerns legible to the business.

**A good answer**:

- Not all debt matters. Prioritize by **interest × frequency**: debt in code you change often costs every sprint; debt in code nobody touches can wait.
- Pay it down **incrementally**: leave code better than you found it, tie clean-up to features that touch the area, reserve a slice of capacity, and use the strangler-fig pattern for big replacements.
- **Make the case in business terms**: incidents, lead time, onboarding time, the roadmap item it blocks, with data.
- Record **deliberate debt** when you take shortcuts on purpose, so it's a decision rather than an accident.

Then give a real example where you did this.

### A strong answer covers
- Prioritizing by cost of interest
- Incremental pay-down strategies
- Business-language justification with data
- A real example

### Likely follow-ups
- Your product manager says there's no time for this quarter. What do you do?
