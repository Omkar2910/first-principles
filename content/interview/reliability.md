## Explain SLIs, SLOs, SLAs and error budgets.
> round: concepts | level: mid | lessons: reliability/slos-and-error-budgets, reliability/what-reliability-means

- **SLI** (indicator): a ratio of good events to total events for something users notice, such as the share of checkout requests that succeed within 300 ms.
- **SLO** (objective): the internal target for that SLI over a window, such as 99.9% over 30 days.
- **SLA** (agreement): a contract with customers, with consequences (credits) if missed. It should be looser than the SLO.
- **Error budget** = 1 − SLO. At 99.9%, 0.1% of requests may fail. While budget remains, spend it on shipping faster; when it's exhausted, prioritize reliability work.

Practical points: measure from the **user's perspective** (per request, per journey), pick a **few journey-based** SLOs, and **alert on burn rate** (how fast the budget is being consumed) rather than on causes like CPU. Higher targets cost much more, so choose them per journey based on what users actually notice.

### A strong answer covers
- Clear distinction between the three terms
- Error budget as a decision tool between speed and reliability
- User-perspective measurement
- Burn-rate alerting

### Likely follow-ups
- How much downtime per month does 99.9% allow? (about 43 minutes)
- Your service depends on three services at 99.9% each. What's the best you can promise? (serial dependencies multiply: about 99.7%)

## What's the difference between logs, metrics and traces? How do you use them together?
> round: concepts | level: mid | lessons: reliability/observability, backend-first-principles/configuration-and-logging

- **Metrics** are cheap numbers over time (request rate, error rate, latency percentiles). Use them to **detect** problems and alert. Keep label cardinality low: never put user IDs in metric labels.
- **Traces** follow one request across services, showing where the time went. Use them to **locate** the problem.
- **Logs** are detailed, structured events. Use them to **explain** what happened, with request and trace IDs so you can jump from a trace to its logs.

Frameworks for what to measure: **RED** for services (rate, errors, duration) and **USE** for resources (utilization, saturation, errors). Look at **percentiles** (p95, p99), not averages, which hide the slow tail. **OpenTelemetry** gives vendor-neutral instrumentation and propagates trace context between services.

### A strong answer covers
- Detect → locate → explain
- RED and USE
- Percentiles over averages; low-cardinality metrics
- Correlation via trace/request IDs

### Likely follow-ups
- p99 latency doubled but the average didn't move. What does that tell you?

## Compare rolling, blue-green and canary deployments.
> round: concepts | level: mid | lessons: reliability/deployment-strategies, cloud-infra/ci-cd

- **Rolling**: replace instances a few at a time. No extra capacity needed, but old and new versions run side by side, and rollback means rolling again.
- **Blue-green**: run a full second environment with the new version and switch traffic at once. Instant cutover and rollback, but double the capacity, and the database is shared, so schema changes still need care.
- **Canary**: send a small share of real traffic to the new version, compare its metrics with the old version, then widen gradually. Smallest blast radius and data-driven, but needs good metrics and automation.

Two practices matter more than the strategy: **separate deploy from release with feature flags** (and clean old flags up), and keep changes **backward compatible**, so you can always **roll back first and debug later**. Most incidents are triggered by changes, so small, observable, reversible changes are the goal.

### A strong answer covers
- The three strategies with their costs
- Mixed versions during rollout
- Feature flags to decouple deploy and release
- Rollback-first mindset

### Likely follow-ups
- How would you automate the canary's go/no-go decision?

## Your service is overloaded and latency is climbing. What do you do?
> round: concepts | level: senior | lessons: reliability/overload-and-degradation, distributed-systems/timeouts-retries-circuit-breakers, reliability/incident-response

**Immediately**: mitigate before investigating. Ask what changed (a deploy, a traffic spike, a slow dependency). Roll back a bad change, scale out if it'll help in time, and **shed load**: reject excess requests early and cheaply (fast 429/503) rather than letting everything slow down.

**Why it spirals**: overload plus unbounded queues plus client retries leads to **congestion collapse**: requests wait so long they time out, clients retry, and the server does work nobody is waiting for any more.

**Design defences**:

- **Bounded queues** and **deadlines**: drop work whose caller has already given up.
- **Prioritize** critical traffic (checkout over recommendations).
- **Backpressure** to upstream callers.
- **Degraded modes with kill switches**: turn off non-essential features to protect the core.
- Retry budgets and circuit breakers on the client side.

Autoscaling helps but is too slow on its own for sudden spikes.

### A strong answer covers
- Mitigate first: rollback, shed load, scale
- Congestion collapse and the role of retries
- Bounded queues, deadlines, prioritization
- Planned degradation; autoscaling's limits

### Likely follow-ups
- How do you decide which requests to drop first?

## Tell me how you'd run a production incident.
> round: behavioral | level: senior | lessons: reliability/incident-response, reliability/postmortems, career-ladder/owning-production

During the incident:

- **Mitigate first, root-cause later.** Ask "what changed?"; roll back or fail over before understanding why.
- **Assign an Incident Commander** who coordinates rather than debugs, and separate the roles: coordination, investigation, communication.
- **Communicate regularly**: impact, current status, and when the next update will come, even if nothing has changed.

After it:

- A **blameless postmortem**: summary, impact, timeline, contributing factors (systems and conditions, not people), what went well, and actions.
- Actions that are **specific, owned and dated**, covering prevention, detection and mitigation, and tracked to completion.
- Look for patterns across incidents, not just this one.

In a behavioral interview, tell a real story in STAR form: your role, what you did to mitigate, how you communicated, and what changed afterwards because of you.

### A strong answer covers
- Mitigation before diagnosis
- Clear roles and regular communication
- Blameless postmortem with owned actions
- A real example with your personal contribution

### Likely follow-ups
- What's the difference between a root cause and contributing factors?
- How do you keep on-call sustainable?
