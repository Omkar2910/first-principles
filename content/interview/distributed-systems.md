## Explain the CAP theorem. How does it affect real design decisions?
> round: concepts | level: mid | lessons: distributed-systems/cap-and-pacelc, distributed-systems/consistency-models

CAP says that when a **network partition** happens, a distributed system must choose between **consistency** (every read sees the latest write, or gets an error) and **availability** (every request gets a non-error answer, possibly stale). Partitions aren't optional in real networks, so "CA" isn't a real choice; the question is what you do *during* one.

In practice the choice is made **per operation**, by asking which is worse: a stale answer or no answer?

- Inventory decrement, payments, seat booking: stale is worse, so prefer consistency (refuse or wait).
- A social feed, product reviews, view counts: no answer is worse, so prefer availability.

**PACELC** adds the everyday case: **Else**, with no partition, you still trade **latency** against consistency (for example, waiting for a quorum or a synchronous replica). Many databases are tunable, so labels like "Cassandra is AP" oversimplify.

### A strong answer covers
- A correct definition of C and A in CAP's sense
- P is not optional; the choice is during a partition
- Choosing per operation with examples
- PACELC's latency vs consistency trade-off

### Likely follow-ups
- How would a shopping cart behave during a partition if you chose availability?
- What does a quorum read/write (R + W > N) give you?

## Can a message system give you exactly-once delivery?
> round: concepts | level: senior | lessons: distributed-systems/idempotency, scaling/message-queues, distributed-systems/outbox-and-cdc

Not end to end across a network, in general. A consumer can process a message and crash before acknowledging it; the broker can't tell the difference between "lost" and "slow", so it redelivers. Delivery is **at least once** in practice.

What you can build is **exactly-once *outcomes***: at-least-once delivery + **idempotent processing**.

- Give each message a unique ID; record processed IDs (an **inbox** table) in the **same transaction** as the side effect, and skip duplicates.
- Make operations naturally idempotent where possible: set absolute values, use guarded state transitions.
- On the producer side, avoid dual writes with the **outbox** pattern.

Some systems (Kafka transactions, for example) offer exactly-once semantics *within* their own boundary, such as read-process-write between topics, but once you touch an external system like a database or an email provider, you're back to idempotency.

### A strong answer covers
- Why redelivery is unavoidable (ambiguous failures)
- At-least-once + idempotency = exactly-once effect
- Inbox/dedupe table in the same transaction
- Where broker-level "exactly once" stops applying

### Likely follow-ups
- How long do you keep processed message IDs?
- The side effect is a call to a payment provider. How do you make that idempotent?

## How do you make calls to another service resilient: timeouts, retries and circuit breakers?
> round: concepts | level: mid | lessons: distributed-systems/timeouts-retries-circuit-breakers, reliability/overload-and-degradation

**Timeouts** on every remote call. Without one, a slow dependency holds your threads until you fall over too. Set them from measured latency percentiles, and **propagate deadlines**: if the user's request has 2 s and 1.5 s is spent, the downstream call gets 0.5 s, not a fresh 2 s.

**Retries**, carefully:

- Only for **idempotent** operations and **retryable** errors (timeouts, 503), not 400s.
- **Exponential backoff with jitter**, so clients don't retry in synchronized waves.
- At **one layer** only; retries at every layer multiply (3 layers × 3 attempts each can turn into dozens of calls).
- Within a **retry budget** (for example, retries add at most ~10% extra load).

**Circuit breakers** stop calling a dependency that's failing, fail fast, and periodically probe for recovery, which gives it room to recover. Add **bulkheads** (separate pools per dependency) and **fallbacks** (cached or degraded responses).

### A strong answer covers
- Timeouts everywhere and deadline propagation
- Retry only idempotent, retryable failures with backoff + jitter
- Retry amplification across layers
- Circuit breakers, bulkheads, fallbacks

### Likely follow-ups
- Your dependency recovers, and then immediately falls over again. Why? (thundering herd of retries)
- How do you choose a timeout value?

## What is the outbox pattern, and what problem does it solve?
> round: concepts | level: senior | lessons: distributed-systems/outbox-and-cdc, backend-first-principles/background-jobs

The problem is the **dual write**: a service saves an order to its database and publishes an `OrderPlaced` event to Kafka as two separate operations. If the publish fails after the commit, downstream services never hear about the order. If you publish first and the commit fails, they hear about an order that doesn't exist. No ordering of the two steps is safe, and a database transaction can't cover the broker.

**Outbox**: write the event into an `outbox` table **in the same database transaction** as the business change. Both commit or neither does. A separate relay then publishes outbox rows to the broker, either by polling the table or with **change data capture** (for example, Debezium tailing the database's write-ahead log, which gives low latency and preserves order).

The relay can publish an event more than once (it may crash after publishing, before marking the row sent), so consumers must be **idempotent**, for example with an inbox table.

### A strong answer covers
- A concrete dual-write failure
- Same-transaction write to an outbox table
- Polling vs CDC relay
- At-least-once publishing → idempotent consumers

### Likely follow-ups
- How do you keep the outbox table from growing forever?
- How does this preserve event ordering per order?

## How do you keep data consistent across microservices without a distributed transaction?
> round: concepts | level: senior | lessons: distributed-systems/distributed-transactions-sagas, distributed-systems/outbox-and-cdc, distributed-systems/idempotency

**Two-phase commit** gives atomicity across participants, but it's blocking (a coordinator failure can leave participants stuck holding locks), slow, and not supported by most modern services and brokers.

The usual answer is a **saga**: a sequence of **local transactions**, each in one service, where every step has a **compensating action** to undo it if a later step fails. Order placed → payment charged → stock reserved; if stock fails, refund the payment and cancel the order.

- **Choreography**: services react to each other's events. Simple for short flows, hard to follow as they grow.
- **Orchestration**: a coordinator or workflow engine drives the steps. Easier to reason about and monitor for complex flows.

Sagas give up **isolation**: other requests can see intermediate states (a charged payment with no stock yet), so design for that. Make every step idempotent, keep saga state durable, and put steps that **can't be compensated** (sending an email, shipping) last.

### A strong answer covers
- Why 2PC is usually not an option
- Local transactions + compensations
- Choreography vs orchestration
- Lost isolation, idempotent steps, non-compensatable steps last

### Likely follow-ups
- A compensation itself fails. What now?
- How would you show a user the status of a long-running saga?

## Why shouldn't you use timestamps from different machines to order events?
> round: concepts | level: senior | lessons: distributed-systems/time-and-ordering, distributed-systems/why-distributed-is-hard

Wall clocks on different machines **drift** and can **jump** (NTP corrections, leap seconds, VM pauses). Two events a few milliseconds apart on different servers can easily get timestamps in the wrong order, so "last write wins by timestamp" can silently discard the newer write.

Better tools:

- **Monotonic clocks** for measuring durations and timeouts on one machine.
- **Logical clocks**: Lamport clocks give an order consistent with causality; vector clocks can also detect that two events were concurrent.
- **A single sequencer** for things that need a total order, such as a per-conversation sequence number in chat, or a database's own commit order.
- **Hybrid logical clocks** and Google's TrueTime, which some modern databases use to bridge physical and logical time.

### A strong answer covers
- Drift and jumps as the core problem
- Wall clock vs monotonic clock
- Lamport and vector clocks, and what each gives
- Sequence numbers from a single owner as the practical fix

### Likely follow-ups
- How does a chat system keep messages in order within a conversation?
- How would you detect and resolve two concurrent edits to the same document?

## Monolith or microservices: what would you recommend for a new product?
> round: concepts | level: senior | lessons: distributed-systems/monolith-vs-microservices, lld/ddd-and-hexagonal

For a new product, usually a **modular monolith**: one deployable, but with clear internal module boundaries that own their data and talk through defined interfaces. It's simpler to build, test, deploy and debug, and you avoid network calls, distributed transactions and partial failures until you need them.

Split out a service for a **concrete reason**: independent scaling of one hot component, very different reliability or security needs, or, most often, **team scaling**, when many teams stepping on each other in one codebase slows everyone down.

When you do split:

- Draw boundaries by **business capability** and transactional consistency (things that must change together stay together).
- Each service **owns its data**; no shared databases.
- Extract **incrementally** (strangler fig), not as a big-bang rewrite.

The trap is the **distributed monolith**: services that must be deployed together and call each other synchronously for everything, with all the costs of both and the benefits of neither.

### A strong answer covers
- Modular monolith as a sensible default, with reasons
- Concrete triggers for splitting, especially team scaling
- Data ownership and boundary-drawing
- The distributed monolith anti-pattern

### Likely follow-ups
- How would you carve the first service out of a monolith?
- Two services need the same customer data. What do you do?
