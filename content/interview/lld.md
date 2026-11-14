## Explain the SOLID principles. When would you *not* apply them?
> round: lld | level: mid | lessons: lld/solid, lld/oop-done-right

- **S**ingle responsibility: a class has one reason to change.
- **O**pen/closed: add behaviour by adding code (a new implementation), not by editing a growing `if/else`.
- **L**iskov substitution: a subtype keeps the promises of its parent; callers shouldn't need to know which one they have.
- **I**nterface segregation: small, role-specific interfaces instead of one fat one.
- **D**ependency inversion: high-level policy depends on abstractions it owns; details (databases, HTTP clients) implement them.

When *not* to: apply them where **variation is real**. An interface with exactly one implementation "in case we need another" is speculative abstraction: more files, more indirection, no benefit. Start concrete; introduce the abstraction when a second case appears or a test needs a seam.

A good example to bring: pricing rules that change often become a `PricingStrategy` interface (open/closed in action), while a one-off CSV exporter stays a simple class.

### A strong answer covers
- Each principle in one plain sentence
- A concrete example for at least two
- Applying them where variation is real
- The cost of over-abstraction

### Likely follow-ups
- Give an example of a Liskov violation. (The classic: a `Square` that extends `Rectangle`.)
- How does dependency inversion make code easier to test?

## Composition or inheritance: which do you prefer, and why?
> round: lld | level: mid | lessons: lld/oop-done-right, lld/structural-patterns

Prefer **composition**. Inheritance couples a subclass to its parent's internals: changes to the base class ripple into every child, and deep hierarchies become rigid when a new combination of behaviours appears ("a flying, swimming, logging duck").

With composition, an object **has** collaborators behind interfaces and delegates to them. You can mix behaviours, swap them at runtime, and test each piece alone. Patterns like Strategy and Decorator are composition in practice.

Use inheritance for a **stable "is-a"** relationship where the subtype genuinely honours the parent's contract, or for framework extension points designed for it. Modern Java also offers **sealed types with pattern matching** as an alternative to class hierarchies for closed sets of variants.

### A strong answer covers
- The coupling problem with inheritance
- Composition + interfaces as the flexible default
- When inheritance is still right
- A pattern example (Strategy, Decorator)

### Likely follow-ups
- How would you add logging to every method of a service without modifying it? (Decorator or a proxy)

## What's the difference between the Strategy and State patterns?
> round: lld | level: mid | lessons: lld/behavioral-patterns, lld/lld-parking-lot

Both put varying behaviour behind an interface, so the code looks similar. The difference is **who chooses** and **why**:

- **Strategy**: the *client* picks an algorithm, and it usually stays fixed for that use: a pricing strategy, a spot-allocation strategy, a split type in Splitwise. It answers "how should this be done?"
- **State**: the object's behaviour changes as its **internal state** changes, and the states themselves trigger **transitions**: an order moving `CREATED → PAID → SHIPPED`, where `cancel()` behaves differently in each. It answers "what is allowed right now?" One class per state makes illegal transitions impossible to express.

In an LLD interview, strategies are the usual tool for the "variation points" (pricing, allocation, payment), and State fits anything with a lifecycle.

### A strong answer covers
- Client-selected algorithm vs state-driven behaviour with transitions
- A concrete example of each
- Illegal transitions made impossible with State
- Where each shows up in a typical LLD problem

### Likely follow-ups
- Would you use the State pattern or an enum with a transition table? Why?

## How would you design an API endpoint that creates a payment, so that retries are safe?
> round: lld | level: mid | lessons: lld/api-design, distributed-systems/idempotency, hld/payment-system

Retries happen: the client times out, the network drops the response, a mobile app resends. Without protection, a retried `POST /payments` charges twice.

Use an **idempotency key**:

1. The client generates a unique key per logical operation and sends it in a header (`Idempotency-Key: …`).
2. The server **atomically claims** the key (for example, an insert with a unique constraint) before doing the work.
3. It stores the **response** with the key. A repeat with the same key returns the stored response instead of charging again.
4. It **verifies the payload**: the same key with a different body is an error, not a replay.
5. Keys **expire** after a sensible window.

Other API details that come up: money in **minor units** (cents) as integers, not floats; string IDs; ISO 8601 timestamps; one consistent error format; **cursor pagination** for list endpoints; **ETags** for optimistic concurrency on updates.

### A strong answer covers
- Why retries cause duplicates
- Atomic claim, stored response, payload check, expiry
- Money as integer minor units
- Consistent conventions (errors, IDs, dates, pagination)

### Likely follow-ups
- Two requests with the same key arrive at the same moment. What happens?
- Why cursor pagination rather than page numbers?

## What is an aggregate in domain-driven design?
> round: lld | level: senior | lessons: lld/ddd-and-hexagonal, distributed-systems/monolith-vs-microservices

An **aggregate** is a cluster of objects treated as **one consistency boundary**, with a single root entity that outside code goes through. An `Order` aggregate might contain its line items; everything inside must be consistent when a transaction commits, enforced by the root's methods (`order.addItem(…)` checks the rules).

Rules of thumb:

- Keep aggregates **small**.
- Reference other aggregates **by ID**, not by object reference.
- Change **one aggregate per transaction**; coordinate across aggregates with **domain events** and eventual consistency.

This connects to service boundaries: things that must be consistent together belong in one aggregate (and one service); across boundaries you accept eventual consistency. **Hexagonal architecture** keeps the domain at the centre, with ports it owns and adapters (database, HTTP, messaging) at the edges.

### A strong answer covers
- Consistency boundary with a root
- Small, by-ID references, one per transaction
- Domain events between aggregates
- The link to service boundaries

### Likely follow-ups
- Placing an order must also reserve stock. Is that one aggregate or two?
