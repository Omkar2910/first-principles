/**
 * Timed mock-interview drills. Rubric items are drawn from the matching lessons, which are the
 * fact-checked source; each item links back to where it's taught.
 */

export type Phase = { name: string; minutes: number; prompt: string };
export type RubricItem = { text: string; lesson: string };

export type Drill = {
  id: string;
  kind: "hld" | "lld";
  title: string;
  level: "mid" | "senior";
  prompt: string;
  /** What the interviewer would say if asked; revealed on demand. */
  clarifications: string[];
  lesson: string;
  rubric: RubricItem[];
};

/** The six steps from "A Framework for System Design", 45 minutes in all. */
export const HLD_PHASES: Phase[] = [
  { name: "Clarify requirements", minutes: 5, prompt: "Functional and non-functional requirements. What's in and out of scope?" },
  { name: "Estimate", minutes: 4, prompt: "QPS, read:write ratio, storage. Only the numbers that change the design." },
  { name: "API", minutes: 4, prompt: "The few endpoints or messages, with inputs and outputs." },
  { name: "Data model", minutes: 5, prompt: "Entities, keys, access patterns, which store and why." },
  { name: "High-level design", minutes: 15, prompt: "Boxes and arrows for the main flows. Start simple." },
  { name: "Deep dives & trade-offs", minutes: 12, prompt: "The hardest part, failure modes, and what you'd change at 10× scale." },
];

/** The LLD approach from the parking-lot case study, 45 minutes in all. */
export const LLD_PHASES: Phase[] = [
  { name: "Clarify requirements", minutes: 5, prompt: "Use cases, actors, what varies, what's out of scope." },
  { name: "Entities & responsibilities", minutes: 8, prompt: "Nouns become classes; give each one job." },
  { name: "Variation points", minutes: 5, prompt: "What will change? Put an interface (strategy) there." },
  { name: "Core code", minutes: 17, prompt: "Write the main flow end to end." },
  { name: "Concurrency & edge cases", minutes: 6, prompt: "What happens with two requests at once? Invalid input?" },
  { name: "Walkthrough & extensions", minutes: 4, prompt: "Trace one scenario; show how the design flexes." },
];

const FRAMEWORK = "hld/design-framework";

export const drills: Drill[] = [
  {
    id: "url-shortener",
    kind: "hld",
    title: "Design a URL shortener",
    level: "mid",
    prompt: "Design a service like bit.ly: users submit a long URL and get a short link; visiting the short link redirects to the original.",
    clarifications: [
      "Assume 100M new URLs per month and about 100 redirects per new URL.",
      "Custom aliases and expiry are nice to have.",
      "Redirects should be fast (tens of milliseconds) and highly available.",
    ],
    lesson: "hld/url-shortener",
    rubric: [
      { text: "Clarified scale and noticed the read:write ratio is very skewed toward reads", lesson: "hld/url-shortener" },
      { text: "Chose a code-generation scheme (ID ranges + base62, or random with a unique constraint) and explained collisions", lesson: "hld/url-shortener" },
      { text: "Made short codes non-enumerable (shuffled or random), not plain sequential IDs", lesson: "hld/url-shortener" },
      { text: "Put a cache in front of the redirect lookup and discussed what happens on a miss", lesson: "scaling/caching" },
      { text: "Chose 301 vs 302 deliberately and explained the effect on caching and analytics", lesson: "hld/url-shortener" },
      { text: "Kept analytics off the hot path (async events)", lesson: "hld/url-shortener" },
      { text: "Covered expiry, custom aliases and abuse (spam/phishing links)", lesson: "hld/url-shortener" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "rate-limiter",
    kind: "hld",
    title: "Design a rate limiter",
    level: "mid",
    prompt: "Design a rate limiter for a public API that runs on many servers: each API key may make at most N requests per minute.",
    clarifications: [
      "Limits are per API key; some customers have higher limits.",
      "Short bursts are acceptable as long as the average stays within the limit.",
      "The API runs on 20+ instances behind a load balancer.",
    ],
    lesson: "scaling/rate-limiting",
    rubric: [
      { text: "Compared at least two algorithms (token bucket, fixed window, sliding window) and picked one for a reason", lesson: "scaling/rate-limiting" },
      { text: "Explained why per-instance counters fail with many servers", lesson: "scaling/stateless-and-stateful-services" },
      { text: "Used a shared atomic counter (e.g. Redis with a Lua script) or edge enforcement", lesson: "scaling/rate-limiting" },
      { text: "Returned 429 with Retry-After (and rate-limit headers) so clients can back off", lesson: "scaling/rate-limiting" },
      { text: "Decided fail-open vs fail-closed when the limiter's store is down", lesson: "scaling/rate-limiting" },
      { text: "Discussed where it runs: gateway, middleware or sidecar", lesson: "scaling/gateways-proxies-mesh" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "news-feed",
    kind: "hld",
    title: "Design a news feed",
    level: "senior",
    prompt: "Design the home feed for a social network: users follow others and see a feed of recent posts from the people they follow.",
    clarifications: [
      "Hundreds of millions of daily users; most only read.",
      "Some accounts have tens of millions of followers.",
      "The feed can be a few seconds stale.",
    ],
    lesson: "hld/news-feed",
    rubric: [
      { text: "Identified fan-out on write vs fan-out on read as the core decision", lesson: "hld/news-feed" },
      { text: "Explained the celebrity problem and proposed a hybrid (push for most, pull for celebrities)", lesson: "hld/news-feed" },
      { text: "Stored post IDs in feeds and hydrated content from caches", lesson: "hld/news-feed" },
      { text: "Skipped fan-out work for inactive users", lesson: "hld/news-feed" },
      { text: "Outlined ranking as candidate generation → scoring → filtering", lesson: "hld/news-feed" },
      { text: "Used a queue for asynchronous fan-out", lesson: "scaling/message-queues" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "chat-system",
    kind: "hld",
    title: "Design a chat system",
    level: "senior",
    prompt: "Design a messaging app like WhatsApp: one-to-one and small group chats, delivery receipts, and online presence.",
    clarifications: [
      "Users have several devices; messages must reach all of them.",
      "Messages must never be lost, and must appear in order within a conversation.",
      "Offline users get messages when they reconnect.",
    ],
    lesson: "hld/chat-system",
    rubric: [
      { text: "Used persistent connections (WebSocket) to gateway servers", lesson: "hld/chat-system" },
      { text: "Kept a session registry (user/device → gateway) to route between gateways", lesson: "hld/chat-system" },
      { text: "Persisted the message before pushing it, then acknowledged", lesson: "hld/chat-system" },
      { text: "Ordered messages with a per-conversation sequence and synced by sequence on reconnect", lesson: "hld/chat-system" },
      { text: "Made sends idempotent with client-generated message IDs", lesson: "hld/chat-system" },
      { text: "Treated presence as cheap, lossy and throttled", lesson: "hld/chat-system" },
      { text: "Handled offline users (push notification + sync)", lesson: "hld/chat-system" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "notification-system",
    kind: "hld",
    title: "Design a notification system",
    level: "mid",
    prompt: "Design a service other teams call to send notifications over push, email and SMS.",
    clarifications: [
      "Both transactional (password reset, OTP) and bulk marketing messages.",
      "Users can choose channels and set quiet hours.",
      "Third-party providers sometimes fail or throttle.",
    ],
    lesson: "hld/notification-system",
    rubric: [
      { text: "Central API → preferences/templates/dedupe → queues → per-channel provider workers", lesson: "hld/notification-system" },
      { text: "Separated transactional from bulk traffic (priorities / separate queues)", lesson: "hld/notification-system" },
      { text: "Made sends idempotent and deduplicated", lesson: "distributed-systems/idempotency" },
      { text: "Retries with backoff, provider failover and a dead-letter queue", lesson: "hld/notification-system" },
      { text: "Treated preferences, quiet hours and unsubscribe as core requirements", lesson: "hld/notification-system" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "payment-system",
    kind: "hld",
    title: "Design a payment system",
    level: "senior",
    prompt: "Design the payments backend for an e-commerce site: charge customers at checkout and pay out to sellers.",
    clarifications: [
      "Use an external payment service provider (PSP) for card processing.",
      "Correctness matters more than latency: no double charges, no lost money.",
      "Finance needs an audit trail.",
    ],
    lesson: "hld/payment-system",
    rubric: [
      { text: "Used a PSP and kept raw card data out of your systems", lesson: "hld/payment-system" },
      { text: "Modelled the payment as a state machine with guarded transitions", lesson: "hld/payment-system" },
      { text: "Used idempotency keys end to end, including webhook handling", lesson: "hld/payment-system" },
      { text: "Designed a double-entry, append-only ledger with derived balances", lesson: "hld/payment-system" },
      { text: "Treated a timeout as 'unknown', not 'failed', and resolved it by querying the PSP", lesson: "hld/payment-system" },
      { text: "Added daily reconciliation against PSP reports", lesson: "hld/payment-system" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "search-autocomplete",
    kind: "hld",
    title: "Design search autocomplete",
    level: "mid",
    prompt: "Design the type-ahead suggestions for a search box: as the user types, show the top 5 completions.",
    clarifications: [
      "Billions of queries a day; suggestions must appear in well under 100 ms.",
      "Suggestions are ranked by popularity; trending terms should show up within minutes to hours.",
    ],
    lesson: "hld/search-autocomplete",
    rubric: [
      { text: "Used a trie with precomputed top-K at each node", lesson: "hld/search-autocomplete" },
      { text: "Separated the offline build path (aggregation) from the serving path", lesson: "hld/search-autocomplete" },
      { text: "Served immutable snapshots that are swapped in, not updated in place", lesson: "hld/search-autocomplete" },
      { text: "Sharded by prefix with replicas, and cached popular prefixes", lesson: "hld/search-autocomplete" },
      { text: "Debounced requests on the client", lesson: "hld/search-autocomplete" },
      { text: "Covered freshness (trending overlay) and filtering offensive suggestions", lesson: "hld/search-autocomplete" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "ride-hailing",
    kind: "hld",
    title: "Design a ride-hailing service",
    level: "senior",
    prompt: "Design the core of Uber or Lyft: riders request a ride, nearby drivers are matched, and the trip is tracked.",
    clarifications: [
      "Drivers send their location every few seconds.",
      "A driver must never be assigned two rides at once.",
      "The service runs in many cities.",
    ],
    lesson: "hld/ride-hailing",
    rubric: [
      { text: "Noticed location updates dominate the load; kept latest positions in memory with TTLs", lesson: "hld/ride-hailing" },
      { text: "Used a geospatial index (geohash, quadtree or H3) for 'drivers near me'", lesson: "hld/ride-hailing" },
      { text: "Prevented double-booking with atomic, time-limited offers", lesson: "hld/ride-hailing" },
      { text: "Modelled the trip lifecycle and stored trips in a durable, consistent store", lesson: "hld/ride-hailing" },
      { text: "Sharded by city/region", lesson: "hld/ride-hailing" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "video-streaming",
    kind: "hld",
    title: "Design a video streaming platform",
    level: "senior",
    prompt: "Design YouTube: creators upload videos, and viewers watch them on any device and network.",
    clarifications: [
      "Uploads can be several gigabytes.",
      "Viewers range from fibre to poor mobile connections.",
      "View counts are shown on each video.",
    ],
    lesson: "hld/video-streaming",
    rubric: [
      { text: "Uploaded directly to object storage via pre-signed URLs", lesson: "hld/video-streaming" },
      { text: "Processed asynchronously: transcode chunks in parallel into a bitrate ladder", lesson: "hld/video-streaming" },
      { text: "Packaged as HLS/DASH segments for adaptive bitrate playback", lesson: "hld/video-streaming" },
      { text: "Served segments from a CDN as static files", lesson: "scaling/cdn" },
      { text: "Counted views via events and aggregation, not a database update per view", lesson: "hld/video-streaming" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "ticket-booking",
    kind: "hld",
    title: "Design a ticket booking system",
    level: "senior",
    prompt: "Design Ticketmaster: users pick seats for a concert and pay. Popular shows sell out in minutes.",
    clarifications: [
      "A seat must never be sold twice.",
      "Users get a few minutes to pay after choosing seats.",
      "On-sale moments bring huge traffic spikes.",
    ],
    lesson: "hld/ticket-booking",
    rubric: [
      { text: "Modelled the seat lifecycle: AVAILABLE → HELD (with TTL) → SOLD", lesson: "hld/ticket-booking" },
      { text: "Made holds atomic (conditional write / lock) so double-selling is impossible", lesson: "hld/ticket-booking" },
      { text: "Released expired holds automatically", lesson: "hld/ticket-booking" },
      { text: "Absorbed the spike with a virtual waiting room served from a CDN", lesson: "hld/ticket-booking" },
      { text: "Strongly consistent writes, cached/eventually consistent seat-map reads", lesson: "hld/ticket-booking" },
      { text: "Followed a structure and stated trade-offs out loud", lesson: FRAMEWORK },
    ],
  },
  {
    id: "parking-lot",
    kind: "lld",
    title: "Design a parking lot (LLD)",
    level: "mid",
    prompt: "Design the classes for a multi-floor parking lot: vehicles enter, get a spot that fits, and pay when they leave.",
    clarifications: [
      "Spots come in sizes (motorcycle, car, large); vehicles need a spot that fits.",
      "Pricing may differ by vehicle type and duration, and will change.",
      "Several entry gates operate at the same time.",
    ],
    lesson: "lld/lld-parking-lot",
    rubric: [
      { text: "Clarified requirements before writing classes", lesson: "lld/lld-parking-lot" },
      { text: "Identified entities with one clear responsibility each (lot, floor, spot, ticket, vehicle)", lesson: "lld/lld-parking-lot" },
      { text: "Used strategies for spot allocation, pricing and payment", lesson: "lld/behavioral-patterns" },
      { text: "Made find-and-occupy atomic so two gates can't take the same spot", lesson: "lld/lld-parking-lot" },
      { text: "Freed the spot only after payment", lesson: "lld/lld-parking-lot" },
      { text: "Discussed extensions to show the design flexes", lesson: "lld/lld-parking-lot" },
    ],
  },
  {
    id: "splitwise",
    kind: "lld",
    title: "Design Splitwise (LLD)",
    level: "mid",
    prompt: "Design the classes for an expense-sharing app: users add expenses split among group members and see who owes whom.",
    clarifications: [
      "Splits can be equal, exact amounts or percentages.",
      "Users want the fewest payments to settle up.",
    ],
    lesson: "lld/lld-splitwise",
    rubric: [
      { text: "Modelled split types as strategies with validation", lesson: "lld/lld-splitwise" },
      { text: "Used exact money in minor units and distributed rounding remainders", lesson: "lld/lld-splitwise" },
      { text: "Kept net balances with a zero-sum invariant", lesson: "lld/lld-splitwise" },
      { text: "Simplified debts greedily (largest creditor ↔ largest debtor), at most n−1 transfers", lesson: "lld/lld-splitwise" },
      { text: "Kept an immutable expense log with derived balances for edits and audits", lesson: "lld/lld-splitwise" },
    ],
  },
];

export function getDrill(id: string) {
  return drills.find((d) => d.id === id);
}
