## How do you approach a system design interview question?
> round: hld | level: mid | lessons: hld/design-framework, career-ladder/interviews-by-level

Follow a structure and say it out loud, so the interviewer can follow and steer:

1. **Clarify requirements** (~5 min): functional (what it does) and non-functional (scale, latency, availability, consistency). Agree on what's out of scope.
2. **Estimate** (~3–5 min): QPS, read:write ratio, storage. Only the numbers that change the design.
3. **API** (~3–5 min): the few key endpoints or messages.
4. **Data model** (~5 min): entities, keys, access patterns, which store and why.
5. **High-level design** (~10–15 min): the main flows end to end. Start simple.
6. **Deep dives** (~10–15 min): the hardest part, bottlenecks, failure modes, and trade-offs.

What evaluators look for: requirements driving each choice ("reads are 100× writes, so…"), trade-offs stated explicitly, depth when asked, pragmatism (no Kafka without a reason), and communication. Common mistakes: jumping to architecture, naming technologies without justifying them, ignoring failures, and spending 20 minutes on one box.

### A strong answer covers
- The steps in order, with rough timings
- Requirements → numbers → design, each choice justified
- Starting simple and adding components to solve identified problems
- Explicit trade-offs and failure modes

### Likely follow-ups
- The interviewer stays silent after giving the prompt. What do you do? (at senior level: drive)
- How would you change your approach for a 30-minute round?

## Estimate the scale of a URL shortener with 100 million new URLs a month.
> round: hld | level: mid | lessons: hld/estimation, hld/url-shortener

Round aggressively; the order of magnitude is what matters. Useful anchor: **a day is about 10⁵ seconds**, so 1 million per day ≈ 12 per second.

- **Writes**: 100M / month ≈ 3.3M / day ≈ **40 writes/s** (peak maybe 2–3× that).
- **Reads**: assume ~100 redirects per URL → **~4,000 reads/s**, peaks above 10,000.
- **Storage**: 100M × 12 months × 5 years = 6 billion URLs × ~500 bytes ≈ **3 TB**.
- **Code length**: base62 with 7 characters = 62⁷ ≈ 3.5 trillion codes, plenty.

What the numbers tell you: writes are tiny, reads dominate, so the design is about **caching and read availability**. 3 TB fits a single well-provisioned database or a key-value store, so sharding isn't the first problem. Say these conclusions out loud; that's the point of estimating.

### A strong answer covers
- The 10⁵ seconds/day shortcut
- Average and peak QPS, read:write ratio, storage
- Rounding without false precision
- Drawing design conclusions from the numbers

### Likely follow-ups
- How much memory would you need to cache the hottest 20% of URLs?
- What changes if reads were 10,000× writes?

## For a news feed, would you fan out on write or on read?
> round: hld | level: senior | lessons: hld/news-feed, scaling/message-queues

- **Fan-out on write (push)**: when someone posts, write the post ID into every follower's precomputed feed. Reading a feed is then one fast lookup. Cost: **write amplification**, which explodes for an account with millions of followers.
- **Fan-out on read (pull)**: build the feed at read time by fetching recent posts from everyone you follow and merging. Writes are cheap; reads are slow and expensive.

The usual answer is a **hybrid**: push for normal accounts, **pull for celebrities** (merge their recent posts in at read time), and skip pre-building feeds for **inactive users**. Store **post IDs** in feeds and hydrate content from caches. Ranking runs as candidate generation → scoring → filtering.

Do the fan-out asynchronously through a queue, so posting is fast even if delivery takes seconds.

### A strong answer covers
- Both strategies and their costs
- The celebrity problem
- Hybrid with inactive-user optimization
- IDs in feeds, async fan-out

### Likely follow-ups
- Where would you draw the line for "celebrity"?
- A user unfollows someone. What happens to their precomputed feed?

## How do you prevent double-booking, for seats or for drivers?
> round: hld | level: senior | lessons: hld/ticket-booking, hld/ride-hailing, foundations/race-conditions-and-locks

The race is a classic check-then-act: two users see seat 14C as available and both try to take it. Checking first and then writing can't work under concurrency; the check and the claim must be **one atomic operation**.

- Model the resource as a **state machine**: `AVAILABLE → HELD (with expiry) → SOLD`.
- Make the claim a **conditional write**: `UPDATE seats SET status='HELD', hold_expires=… WHERE id=? AND status='AVAILABLE'`. Exactly one request sees "1 row updated". The same idea works with Redis `SET … NX` and a TTL, or a conditional write in DynamoDB.
- **Expire holds** automatically, so abandoned checkouts release the seat.
- For ride-hailing, send a driver one **time-limited offer** at a time, claimed atomically.

Around it: strongly consistent **writes**, while the seat map **reads** can be cached and slightly stale. For on-sale spikes, a **virtual waiting room** at the CDN meters users into the booking flow.

### A strong answer covers
- Why check-then-act fails
- An atomic conditional claim
- Holds with TTLs and a state machine
- Consistent writes, cached reads, and protecting the system under spikes

### Likely follow-ups
- The hold expires while the user is on the payment page. What happens?
- How do you keep the waiting room fair?

## A payment request to your provider times out. What do you do?
> round: hld | level: senior | lessons: hld/payment-system, distributed-systems/idempotency

A timeout means **unknown**, not **failed**: the charge may have gone through. Treating it as failed and retrying blindly risks charging the customer twice; treating it as failed and telling them "payment failed" risks taking their money without delivering.

So:

1. Mark the payment `PENDING/UNKNOWN` in a **state machine** with guarded transitions.
2. **Retry with the same idempotency key**, so the provider returns the original result instead of charging again; or **query the provider** for the payment's status.
3. Process provider **webhooks idempotently**: they can arrive late, twice, or out of order.
4. Run **daily reconciliation** against the provider's reports to catch anything that slipped through.

Underneath: a **double-entry, append-only ledger** where balances are derived, so every movement of money is auditable. And never handle raw card numbers yourself; a payment provider does that.

### A strong answer covers
- Timeout = unknown
- Idempotency keys end to end
- State machine + idempotent webhooks
- Reconciliation and a double-entry ledger

### Likely follow-ups
- What exactly does the provider do when it receives a repeated idempotency key?
- Why double-entry rather than a simple balance column?
