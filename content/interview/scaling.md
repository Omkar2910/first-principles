## Why are stateless services easier to scale, and how do you handle user sessions if servers are stateless?
> round: concepts | level: mid | lessons: scaling/stateless-and-stateful-services, scaling/load-balancing, backend-first-principles/authentication

A service is **stateless** when any instance can handle any request, because nothing a request needs lives in one instance's memory. That makes scaling out trivial: the load balancer can send traffic anywhere, autoscalers add and remove instances freely, a crash loses only in-flight requests, and deploys don't log anyone out.

Sessions are the classic state that breaks this. Options, in order of how often I'd pick them:

1. **Shared session store (Redis).** The cookie holds an opaque session ID; any instance looks it up. Logout is instant (delete the key). Costs: a network hop per request, and Redis becomes critical, so it must be highly available and must not evict sessions.
2. **Signed tokens (JWT).** The client carries the state; any instance verifies the signature. No store, but revocation is hard, so access tokens are short-lived with revocable refresh tokens.
3. **Sticky sessions.** The load balancer pins a user to one server. Zero code change, but a crash or deploy still logs those users out, and load gets uneven. A stopgap, not a fix.

### A strong answer covers
- A precise definition: "any instance can serve any request"
- Stateless doesn't mean no state; state moves to a shared store or the client
- Why sticky sessions only hide the problem (crashes, deploys, imbalance)
- The trade-offs of the Redis store (availability, eviction, latency) vs tokens (revocation)

### Likely follow-ups
- What else besides sessions makes a service stateful? (uploads, in-memory rate-limit counters, scheduled jobs)
- Redis goes down. What happens to users, and what would you do?
- Some things must stay stateful, like WebSocket gateways. How do you route to them?

## When would you use cache-aside, and how do you keep the cache from serving stale data?
> round: concepts | level: mid | lessons: scaling/caching, scaling/cache-pitfalls

**Cache-aside**: on a read, check the cache; on a miss, read the database and populate the cache with a TTL. On a write, update the database and **delete** the cache entry (rather than update it), so the next read repopulates it from the source of truth.

It works because access is usually skewed: a small cache holding the hot keys absorbs most reads.

Staleness can't be fully eliminated, so you bound it: a **TTL as a backstop** for any missed invalidation, delete-on-write for the common path, and for strict cases, invalidation driven by change data capture. You also decide per use case how stale is acceptable. A product description can be minutes old; an account balance shouldn't be cached that way at all.

### A strong answer covers
- The read and write paths, and why delete beats update on write
- TTL as a safety net
- Hit rate and staleness tolerance as the things to measure and decide
- At least one failure mode: stampede, penetration, hot keys or cold start

### Likely follow-ups
- A hot key expires and 10,000 requests hit the database at once. How do you prevent it? (single-flight, stale-while-revalidate, jitter)
- Requests for IDs that don't exist keep missing the cache. What do you do? (negative caching, Bloom filters)
- The cache restarts empty. Can the database survive a 0% hit rate?

## What's the difference between a message queue and Kafka, and when would you use each?
> round: concepts | level: mid | lessons: scaling/message-queues, scaling/kafka-and-event-streaming

A **work queue** (SQS, RabbitMQ) delivers each message to one consumer, which acknowledges and removes it. It's ideal for tasks: send this email, resize this image.

**Kafka** is a partitioned, append-only, replayable **log**. Messages stay for a retention period; each consumer group tracks its own offset, so many independent consumers can read the same stream, and you can replay history. The key decides the partition, order is guaranteed only within a partition, and the number of partitions caps a group's parallelism.

Use a queue for one-off tasks; use Kafka for event streams that several services consume, or when you need replay. In both cases delivery is at least once in practice, so consumers must be idempotent.

### A strong answer covers
- One consumer per message (queue) vs every subscriber group reading the log (Kafka)
- Ordering is per key/partition, not global
- At-least-once delivery means idempotent consumers
- Consumer lag and dead-letter queues as operational concerns

### Likely follow-ups
- How do you guarantee all events for one order are processed in order?
- A consumer keeps failing on one poison message. What happens and what do you do?
- Why can't you add more consumers than partitions and get more throughput?

## Why use consistent hashing instead of `hash(key) % N`?
> round: concepts | level: mid | lessons: scaling/consistent-hashing, data/sharding

With modulo hashing, changing N (adding or losing a server) remaps **most** keys. For a cache cluster that means a near-total miss storm; for a datastore, a massive data migration.

Consistent hashing puts servers and keys on the same hash ring; each key belongs to the next server clockwise. Adding or removing a server only moves the keys in that server's slice, roughly **1/N** of them. **Virtual nodes** (each server appears many times on the ring) even out the load and spread a failed server's keys across many neighbours instead of one.

It's used in distributed caches, Dynamo-style stores like Cassandra, and some load balancers. Hash slots (Redis Cluster) and rendezvous hashing solve the same problem differently.

### A strong answer covers
- Why modulo is a problem when N changes
- The ring, clockwise ownership, ~1/N keys moved
- Virtual nodes for balance and failover
- A real system that uses it

### Likely follow-ups
- One key is extremely hot. Does consistent hashing help? (No; you need replication or local caching for hot keys.)
- How would you rebalance when you add a node to a database cluster?

## L4 vs L7 load balancing, and which algorithm would you choose?
> round: concepts | level: mid | lessons: scaling/load-balancing

An **L4** load balancer works on TCP/UDP connections: very fast, but it only sees IPs and ports and balances per connection, so long-lived HTTP/2 or keep-alive connections can pin load unevenly. An **L7** balancer understands HTTP: it balances per request, routes by path, host or header, and often terminates TLS, at the cost of more CPU.

For the algorithm, round robin is fine when requests are uniform but keeps overloading a slow server. **Least outstanding requests** (or **power of two choices**, which gets close to it with much less coordination) adapts to slow servers and uneven request costs, so it's a better default. Hash-based routing is for cache locality, not for balance.

Health checks matter as much as the algorithm: they take dead or unready servers out of rotation. And the load balancer itself must be redundant.

### A strong answer covers
- Connection vs request balancing
- Why least-outstanding-requests beats round robin with a slow backend
- Health checks (active and passive)
- Avoiding the load balancer as a single point of failure

### Likely follow-ups
- Random 502s appear under light traffic. What would you check? (the timeout chain: LB idle timeout vs backend keep-alive)
- Why are sticky sessions discouraged?

## Compare token bucket with fixed-window rate limiting.
> round: concepts | level: mid | lessons: scaling/rate-limiting

A **fixed window** counts requests per clock window (say, per minute) and resets at the boundary. It's simple and cheap, but a client can send a full quota at 0:59 and another at 1:00: double the rate across the boundary.

A **token bucket** holds up to B tokens and refills at a steady rate R; each request takes a token. It allows bursts up to B while enforcing an average of R, which matches how real clients behave. It's the common default. Sliding-window variants smooth out the fixed-window boundary problem at somewhat higher cost.

In a distributed API, the counter must be shared and updated atomically (for example, Redis with a Lua script) or enforced at the edge. Reject with **429** and a `Retry-After` header, and decide up front whether to fail open or closed if the limiter's store is down.

### A strong answer covers
- The boundary burst problem of fixed windows
- Burst capacity + steady refill for token bucket
- Shared atomic state across instances
- 429 + Retry-After, and fail-open vs fail-closed

### Likely follow-ups
- Where would you enforce the limit: gateway, middleware or service?
- Your Redis limiter adds latency to every request. How would you reduce it?
