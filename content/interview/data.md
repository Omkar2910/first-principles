## How does a database index work, and how do you choose the column order of a composite index?
> round: concepts | level: mid | lessons: data/indexes, data/query-performance

Most relational indexes are **B-trees**: sorted, shallow trees where any lookup takes a few page reads instead of scanning the table. Because entries are sorted, they also serve range queries and `ORDER BY`.

For a **composite index** on `(a, b, c)`, the **leftmost-prefix rule** applies: it helps queries filtering on `a`, or `a` and `b`, or all three, but not on `b` alone. Put **equality columns first, then the range or sort column**. For `WHERE user_id = ? AND created_at > ? ORDER BY created_at`, index `(user_id, created_at)`.

Useful extras: a **covering index** includes every column the query needs, so the table isn't touched; a **partial index** covers only matching rows (`WHERE status = 'PENDING'`).

Indexes aren't free: every write updates them, and they use memory. Verify with `EXPLAIN ANALYZE` rather than guessing.

### A strong answer covers
- Sorted structure → logarithmic lookups and range scans
- Leftmost prefix; equality first, then range/sort
- Covering and partial indexes
- Write and memory costs; measuring with EXPLAIN

### Likely follow-ups
- A query uses an index but is still slow. What would you check?
- Why might the database ignore an index you created?

## Your database uses Read Committed. Two requests update the same account balance at the same time. What can go wrong, and how do you fix it?
> round: concepts | level: senior | lessons: data/isolation-levels, data/transactions-acid, foundations/race-conditions-and-locks

Read Committed is a common default (Postgres, for example). It prevents dirty reads but still allows a **lost update**: both transactions read balance 100, both subtract 30, both write 70. One withdrawal vanished. It also allows **write skew**, where two transactions each check a rule against a snapshot and together break it.

Fixes, roughly in order of preference:

1. **Atomic update**: `UPDATE accounts SET balance = balance - 30 WHERE id = ? AND balance >= 30`. The database serializes it.
2. **Optimistic locking**: a `version` column (JPA `@Version`); the second writer fails and retries.
3. **Pessimistic locking**: `SELECT … FOR UPDATE` for a short critical section.
4. **Constraints** that make invalid states impossible.
5. **Serializable** isolation with retry on serialization failures, when the invariant spans many rows.

Know your database: behaviour differs between engines and levels, so check its docs rather than assume.

### A strong answer covers
- A concrete lost-update interleaving
- That Read Committed doesn't prevent it
- Several fixes and when to use each
- MVCC: readers and writers don't block each other, which is why these anomalies exist

### Likely follow-ups
- What is write skew? Give an example (e.g., two doctors both going off call).
- Why not just use Serializable everywhere?

## What is the N+1 query problem, and how do you size a connection pool?
> round: concepts | level: mid | lessons: data/query-performance, data/indexes

**N+1**: you load a list of N orders with one query, then lazily load each order's customer with one more query per row: N+1 round trips. It's invisible with 10 rows in development and painful with 1,000 in production. Fix it with a **fetch join**, **batch fetching** (`WHERE id IN (…)`), or a **projection** query that returns exactly what the page needs. Detect it by logging query counts per request.

**Connection pools** should be sized to what the **database** can handle, not to incoming traffic. A database does its best work with a modest number of active connections; beyond that, they contend for CPU, locks and memory. And the limit is **total across all app instances**: 20 instances × a pool of 50 is 1,000 connections.

Keep transactions short, never make network calls inside them, and batch writes.

### A strong answer covers
- What N+1 looks like and three ways to fix it
- Pool size is a database constraint, multiplied by instance count
- Short transactions without remote calls
- Measuring rather than guessing

### Likely follow-ups
- Requests are timing out waiting for a connection, but the database CPU is low. What's happening?
- Why is deep `OFFSET` pagination slow, and what's the alternative? (keyset pagination)

## A user updates their profile and the page still shows the old value. You use read replicas. What's happening and how do you fix it?
> round: concepts | level: senior | lessons: data/replication, distributed-systems/consistency-models

With leader–follower replication, writes go to the leader and are shipped to followers **asynchronously**. Reads from a follower can lag behind, so the user writes to the leader, the next read hits a replica that hasn't caught up, and they see stale data. This breaks **read-your-writes** consistency.

Fixes:

- **Read your own writes from the leader**: for a short window after a user writes (or for that user's own data), route their reads to the leader.
- **Track replication position**: remember the log position of the user's last write, and only read from replicas that have caught up to it.
- **Keep the session on one replica**, which also gives **monotonic reads** (never seeing time go backwards).
- Accept staleness where it doesn't matter (other people's profiles, analytics).

The underlying trade-off: synchronous replication avoids lag and data loss but adds write latency; asynchronous is fast but lags and can lose recent writes on failover.

### A strong answer covers
- Asynchronous replication lag as the cause
- Read-your-writes and monotonic reads by name
- At least two routing fixes
- Sync vs async replication trade-off

### Likely follow-ups
- The leader dies. What can go wrong during failover? (lost writes, split brain, fencing)
- How would you monitor replication lag?

## When would you shard a database, and how do you choose a shard key?
> round: concepts | level: senior | lessons: data/sharding, scaling/consistent-hashing, data/replication

Shard **last**. First: query and index tuning, a bigger machine, read replicas, caching, and archiving old data. Shard when **writes or total storage** outgrow one machine.

The shard key decides everything:

- It must match the **access pattern**, so most queries hit one shard (for example, `tenant_id` in a B2B app, `user_id` in a consumer app).
- It must **spread load evenly**: no hot shard from a celebrity user or a time-based key where all new writes land on one shard.
- Strategies: **range** (good for range scans, risk of hot spots), **hash** (even, loses ranges), **consistent hashing** (cheaper rebalancing), **directory** (flexible, an extra lookup), **tenant or geo**.

The costs: cross-shard queries and joins, cross-shard transactions, globally unique IDs, and rebalancing data as shards grow.

### A strong answer covers
- Alternatives to try before sharding
- Access patterns and even distribution as the two key-choice criteria
- Strategies with their trade-offs
- The operational costs it introduces

### Likely follow-ups
- One tenant becomes 30% of all traffic. What do you do?
- How do you generate unique IDs across shards?

## How would you rename a column on a large production table without downtime?
> round: concepts | level: senior | lessons: data/schema-migrations, reliability/deployment-strategies

During a rolling deploy, **old and new code run at the same time**, so every intermediate schema must work with both. A plain `RENAME COLUMN` breaks the old code instantly.

Use **expand → migrate → contract**:

1. **Expand**: add the new column (nullable, no default rewrite). Deploy code that **writes both** columns and still reads the old one.
2. **Backfill** the new column in small batches, so you don't hold long locks or flood replication.
3. **Switch** reads to the new column. Deploy.
4. **Contract**: stop writing the old column, deploy, then drop it, only after no code uses it.

Postgres-specific care: create indexes `CONCURRENTLY`, add constraints as `NOT VALID` then `VALIDATE` separately, and set a `lock_timeout` so a migration waiting on a lock doesn't block all traffic behind it.

### A strong answer covers
- Why old and new code coexisting is the core constraint
- The expand/backfill/switch/contract steps, each as a separate deploy
- Batched backfills and lock awareness
- Removing code usage before dropping schema

### Likely follow-ups
- Why can a simple `ALTER TABLE` take the whole site down even if it's fast?
- How do you roll back halfway through?

## SQL or NoSQL: how do you choose a database?
> round: concepts | level: mid | lessons: data/choosing-a-database, data/nosql-families, data/why-databases

Start from requirements, not fashion: **access patterns**, consistency needs, data shape, scale, latency, and what your team can operate.

A relational database (Postgres is the strong default) gives you transactions, constraints, joins and flexible queries, and scales further than most systems need. Choose something else for a **specific, named reason**:

- **Key-value** (Redis, DynamoDB): simple lookups at very high throughput.
- **Document**: self-contained records read and written as a whole.
- **Wide-column** (Cassandra): massive write volume partitioned by key.
- **Search engine**: full-text search and relevance.
- **Graph**: queries about relationships many hops deep.

NoSQL modelling starts from the queries and often duplicates data. If you use several stores, keep **one source of truth** and derive the others (search index, cache, analytics) from it.

A good way to state the decision: requirement → choice → reason → what would make us revisit it.

### A strong answer covers
- Requirements first; Postgres as a justified default
- What each NoSQL family is good at
- Query-first modelling and duplication
- One source of truth when mixing stores

### Likely follow-ups
- Why might you still choose Postgres for a system with 50,000 writes per second?
- How do you keep a search index in sync with the main database? (CDC)
