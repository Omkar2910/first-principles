## What happens when you type a URL into the browser and press Enter?
> round: concepts | level: junior | lessons: foundations/life-of-a-request, foundations/dns, foundations/tls-and-https, foundations/http

Walk the chain of hops, and say what each one costs:

1. **DNS**: the browser resolves the hostname to an IP address, using caches first (browser, OS, resolver), then root → TLD → authoritative servers.
2. **TCP**: a three-way handshake opens a connection to that IP on port 443. One round trip.
3. **TLS**: client and server agree on keys and the server proves its identity with a certificate that chains to a trusted root. Another round trip (one on TLS 1.3).
4. **HTTP**: the browser sends the request (method, path, headers). It typically reaches a CDN or load balancer, then an app server.
5. **The app**: routing, middleware (auth, logging), validation, business logic, usually database queries.
6. **The response** travels back; the browser parses HTML and fetches CSS, JS and images, often reusing the same connection.

The theme that ties it together: **round trips are the unit of cost**, and distance multiplies them. Connection reuse and caching remove whole hops, which is why they're such big wins.

### A strong answer covers
- DNS → TCP → TLS → HTTP → app → database → back, in order
- Caching at each layer (DNS caches, CDN, connection reuse)
- That each handshake costs round trips, and distance makes them expensive
- Going deep on whichever hop the interviewer cares about

### Likely follow-ups
- Where can latency hide in this chain, and how would you find it?
- What changes with HTTP/2 and HTTP/3?
- How does the load balancer decide which server gets the request?

## What's the difference between a process and a thread?
> round: concepts | level: junior | lessons: foundations/processes-and-threads, foundations/race-conditions-and-locks

A **process** is an isolated running program with its own memory space; one crashing doesn't corrupt another. A **thread** is a line of execution *inside* a process; threads share the process's memory, which makes communication cheap but makes shared data dangerous (race conditions).

A CPU core runs one thread at a time; the OS scheduler switches between them to create the illusion of more. Threads that are **waiting** (on I/O, a lock, the network) cost memory but not CPU, which is why a server can have far more threads than cores.

That leads to the practical limit of thread-per-request servers: throughput is capped by roughly `pool size ÷ request duration`. If requests spend most of their time waiting on a slow dependency, the pool fills up long before the CPU does.

### A strong answer covers
- Isolation (process) vs shared memory (thread)
- Context switching, and that waiting threads don't use CPU
- The thread-pool ceiling and what it means for a web server
- Why shared memory brings race conditions

### Likely follow-ups
- Your service has 200 threads and a dependency slows to 2 s per call. What happens?
- How do virtual threads change this?

## What is a race condition, and how do you prevent one in a service running on many instances?
> round: concepts | level: mid | lessons: foundations/race-conditions-and-locks, data/isolation-levels

A race condition happens when correctness depends on the timing of concurrent reads and writes. The two shapes to watch for are **check-then-act** ("if the seat is free, book it") and **read-modify-write** ("read balance, subtract, write it back"): two requests interleave and one update is lost or a rule is broken.

Inside one process, you can use a lock, an atomic variable, or immutable data. But a Java `synchronized` block **doesn't help across instances**: with ten servers, there are ten separate locks. So the fix is to push the atomicity down into the shared store:

- An **atomic update**: `UPDATE accounts SET balance = balance - 10 WHERE id = ? AND balance >= 10`
- A **constraint** (unique index) that makes the bad state impossible
- **Optimistic locking** with a version column, retrying on conflict
- A row lock (`SELECT … FOR UPDATE`) for short critical sections
- For non-database resources, a distributed lock with fencing tokens

### A strong answer covers
- Check-then-act and read-modify-write as the patterns
- Why in-process locks fail across instances
- At least two database-level fixes, and when to prefer each
- Testing for it (concurrent tests), not just reasoning

### Likely follow-ups
- Optimistic vs pessimistic locking: when would you choose each?
- What isolation level does your database use by default, and does it prevent lost updates?

## Blocking vs non-blocking I/O: what's the difference, and where do virtual threads fit?
> round: concepts | level: mid | lessons: foundations/blocking-vs-non-blocking-io, foundations/processes-and-threads

With **blocking I/O**, a thread waits while the network or disk does its work. It's simple to write and debug, but every waiting request holds an OS thread, and OS threads are too expensive (memory, scheduling) to have hundreds of thousands of them.

**Non-blocking I/O** with an event loop (Node.js, Netty) lets a few threads multiplex many connections: register interest, get called back when data is ready. It scales well for I/O-heavy work, but code must **never block** the loop, and callback/reactive code is harder to read and debug.

**Virtual threads** (Java 21+) give you blocking-style code with event-loop-like scalability: they're cheap, and the runtime parks them while they wait on I/O instead of holding an OS thread.

None of these removes the real limit: concurrency is ultimately bounded by your **slowest dependency**. A million virtual threads all waiting on a database with 50 connections is still 50 concurrent queries.

### A strong answer covers
- Why OS threads limit blocking servers
- Event loops: efficient, but one blocking call stalls everything
- Virtual threads as the "best of both" for most services
- The downstream dependency as the true bottleneck

### Likely follow-ups
- What happens if you call a blocking JDBC driver inside an event loop?
- Would virtual threads help a CPU-bound service? (No: they help waiting, not computing.)

## Why does HTTP/3 run over QUIC instead of TCP?
> round: concepts | level: mid | lessons: foundations/networking-tcp-ip, foundations/http

TCP gives you a reliable, ordered byte stream. That ordering has a cost: if one packet is lost, everything behind it waits for the retransmission. This is **head-of-line blocking**.

HTTP/2 multiplexes many requests over **one** TCP connection, which fixed head-of-line blocking at the HTTP level but not at the TCP level: one lost packet stalls every stream on that connection.

**QUIC** builds reliable, encrypted streams on top of UDP, with **independent streams**, so a lost packet only delays its own stream. It also combines the transport and TLS handshakes to cut round trips, and supports connection migration (for example, a phone switching from Wi-Fi to mobile data). HTTP/3 is HTTP over QUIC.

### A strong answer covers
- What TCP guarantees, and the head-of-line blocking that comes with it
- Why HTTP/2 multiplexing didn't fully fix it
- QUIC: UDP-based, independent streams, fewer handshake round trips
- That UDP alone is fire-and-forget; QUIC adds the reliability back

### Likely follow-ups
- When would you use plain UDP in your own service?
- What does TCP's congestion control do, and why does it matter for slow starts on new connections?
