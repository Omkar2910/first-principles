## What's the difference between authentication and authorization?
> round: concepts | level: junior | lessons: backend-first-principles/authentication, backend-first-principles/authorization, security/api-security

**Authentication** proves *who* you are: a password, a session cookie, a token. If it fails, return **401 Unauthorized** (the name is historical; it really means "unauthenticated").

**Authorization** decides *what* that identity may do. If you're known but not allowed, return **403 Forbidden**.

The important part is how authorization is done in practice:

- Check it **on every request, on the server**. The client is never the trust boundary.
- **Roles** (RBAC) are good for features ("admins can delete"), but data access usually needs **ownership checks** ("this order belongs to this user").
- **Scope queries** by owner or tenant (`WHERE tenant_id = ?`) so a forgotten check can't leak another customer's data.
- **Deny by default**, and test the negative cases: user A must not be able to read user B's order by changing an ID in the URL.

### A strong answer covers
- Identity vs permission, and 401 vs 403
- Server-side checks on every request
- Roles for features, ownership for data
- Broken object-level authorization (IDOR) as the classic bug

### Likely follow-ups
- How would you implement multi-tenant isolation so one tenant can never see another's data?
- Where should authorization live: the gateway, or the service?

## Sessions or JWTs: how do you choose?
> round: concepts | level: mid | lessons: backend-first-principles/authentication, scaling/stateless-and-stateful-services, security/oauth-and-oidc

**Sessions**: the server stores the session (in Redis or a database) and the browser holds an opaque ID in a cookie. Lookups cost a round trip, but revocation is instant: delete the session.

**JWTs**: a signed token carries the claims (user ID, expiry). Any service with the key can verify it without a lookup, which suits many services and third-party clients. But a token stays valid until it expires, so logout, bans and password changes are hard.

How I'd choose:

- A web app, often a monolith, with Redis already in place: **sessions**. Simpler and safer.
- Many services, mobile apps or third parties: **short-lived JWT access tokens plus revocable refresh tokens**, often issued by an identity provider via OAuth/OIDC.

Either way, in a browser, keep credentials in **HttpOnly, Secure, SameSite** cookies, not in JavaScript-readable storage.

### A strong answer covers
- Where the state lives in each model
- Revocation as the deciding trade-off
- Short-lived access tokens + refresh tokens
- Cookie flags and why they matter (XSS, CSRF)

### Likely follow-ups
- A user changes their password. How do you log out their other devices with JWTs?
- How do sessions work behind a load balancer with many servers?

## How do you make a background job safe to run more than once?
> round: concepts | level: mid | lessons: backend-first-principles/background-jobs, distributed-systems/idempotency, distributed-systems/outbox-and-cdc

Job systems deliver **at least once**: a worker can crash after doing the work but before acknowledging it, and the job runs again. So the handler must be **idempotent**: running it twice has the same effect as running it once.

Ways to get there:

- **Idempotency key**: record "job X done" in the same transaction as the work, and skip if it's already recorded.
- **Naturally idempotent operations**: set absolute values (`status = 'SHIPPED'`) instead of increments; use guarded state transitions (`UPDATE … WHERE status = 'PENDING'`).
- **Unique constraints** so a duplicate insert fails harmlessly.

Two related traps: the **dual write** (saving to the database and publishing to a queue as two separate steps, so one can fail; fix it with an outbox), and **cron running on every instance** (the 9 a.m. job runs N times unless one scheduler or a lock owns it).

Around it: retries with exponential backoff, and a dead-letter queue for jobs that keep failing.

### A strong answer covers
- At-least-once delivery as the reason
- At least two concrete idempotency techniques
- The dual-write problem and the outbox fix
- Retries, backoff and DLQs

### Likely follow-ups
- The job sends an email via a third party. How do you avoid sending it twice?
- How would you notice that jobs are silently piling up in the DLQ?

## What's the difference between liveness and readiness probes, and how do you deploy with zero downtime?
> round: concepts | level: mid | lessons: backend-first-principles/production-readiness, cloud-infra/kubernetes, reliability/deployment-strategies

- **Liveness**: "is this process stuck?" If it fails, the orchestrator **restarts** the container. It must not check dependencies: if the database is down, restarting every app instance makes things worse.
- **Readiness**: "should this instance get traffic right now?" If it fails, it's taken **out of the load balancer** but not restarted. It's false while starting up, warming caches, or shutting down.

Zero-downtime deploys need both ends handled:

1. **Startup**: new instances only get traffic once ready.
2. **Shutdown**: on SIGTERM, stop accepting new requests, mark not-ready, let in-flight requests finish (graceful drain), then exit. In Kubernetes a short `preStop` delay gives the load balancer time to stop sending traffic first.
3. **Compatibility**: old and new versions run side by side during a rolling deploy, so the API and the database schema must work for both.

### A strong answer covers
- Restart vs remove-from-rotation
- Never checking dependencies in liveness
- Graceful shutdown on SIGTERM
- Backward compatibility during rolling deploys

### Likely follow-ups
- Your liveness probe calls the database. What happens during a database blip?
- How do you rename a database column without downtime?

## REST, gRPC or GraphQL: when would you use each?
> round: concepts | level: mid | lessons: backend-first-principles/api-styles, lld/api-design

- **REST**: resources plus HTTP semantics (methods, status codes, caching). Universally understood and easy to cache, so it's the default for **public APIs**.
- **gRPC**: typed contracts (Protocol Buffers), compact binary encoding over HTTP/2, streaming, generated clients. Great for **internal service-to-service** calls; less suited to browsers and public consumers.
- **GraphQL**: the client asks for exactly the shape it needs in one round trip. Great for **rich UIs** with many screens, often behind a backend-for-frontend; costs include harder caching, query cost limits and N+1 resolvers.

For real-time: **Server-Sent Events** for one-way server push, **WebSockets** for bidirectional messaging.

### A strong answer covers
- A clear "use it when" for each
- Their main costs, not just benefits
- Real-time options
- That most systems mix them (REST outside, gRPC inside)

### Likely follow-ups
- How would you version a public REST API without breaking clients?
- How do you stop a GraphQL client from sending a query that takes down the database?

## How would you design error handling for an API?
> round: concepts | level: mid | lessons: backend-first-principles/error-handling, lld/api-design

Separate two kinds of errors:

- **Expected** errors (validation failure, not found, business-rule violation): return a **4xx** with a clear, machine-readable code. These are the client's to fix.
- **Unexpected** errors (bugs, infrastructure failure): return a **5xx**, log the details with the request ID, and **never leak internals** (stack traces, SQL) to the client.

Then make it consistent:

- **One error format everywhere**: a machine code, a human message, field-level details for validation (all fields at once), and the request ID.
- **Central handling** (an exception handler or middleware), so controllers stay clean.
- **Timeouts on every outbound call**, and a clear policy on which failures are retryable (5xx and timeouts, sometimes; 4xx, no).

### A strong answer covers
- 4xx vs 5xx as "whose fault"
- A consistent, machine-readable format with a request ID
- Centralized handling, no leaked internals
- Retryability and timeouts

### Likely follow-ups
- A downstream service returns 500. What do you return to your client, and why?
- How does a client know whether it's safe to retry a failed POST?
