export type Track = {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  /** Rough stage in the learning path, used to group tracks on the roadmap. */
  stage: "foundations" | "core" | "scale" | "beyond";
  topics: string[];
};

export const tracks: Track[] = [
  {
    slug: "foundations",
    number: 0,
    title: "Foundations",
    tagline: "How a request actually travels",
    description:
      "The machine and the network underneath every backend: processes, threads, memory, TCP/IP, DNS, HTTP and TLS.",
    stage: "foundations",
    topics: ["OS & processes", "Threads & concurrency", "Memory", "TCP/IP", "DNS", "HTTP", "TLS"],
  },
  {
    slug: "backend-first-principles",
    number: 1,
    title: "Backend from First Principles",
    tagline: "Every part of a backend, and why it exists",
    description:
      "Routing, serialization, validation, middleware, auth, API styles, error handling, config, logging and graceful shutdown.",
    stage: "foundations",
    topics: ["Routing", "Serialization", "Validation", "Middleware", "Auth", "REST / gRPC / GraphQL", "Errors & logging"],
  },
  {
    slug: "data",
    number: 2,
    title: "Data",
    tagline: "Storing things without losing them",
    description:
      "Relational modeling, indexes, transactions and isolation, NoSQL families, replication and sharding.",
    stage: "core",
    topics: ["SQL modeling", "B-tree indexes", "Transactions", "Isolation levels", "NoSQL", "Replication", "Sharding"],
  },
  {
    slug: "scaling",
    number: 3,
    title: "Scaling Building Blocks",
    tagline: "The Lego bricks of system design",
    description: "Caching, load balancing, CDNs, queues and streams, rate limiting and consistent hashing.",
    stage: "core",
    topics: ["Caching", "Load balancing", "CDN", "Queues & Kafka", "Rate limiting", "Consistent hashing"],
  },
  {
    slug: "distributed-systems",
    number: 4,
    title: "Distributed Systems",
    tagline: "When one machine is not enough",
    description:
      "CAP and PACELC, consistency models, idempotency, retries, sagas, outbox, consensus and clocks.",
    stage: "scale",
    topics: ["CAP / PACELC", "Consistency models", "Idempotency", "Sagas & outbox", "Raft", "Clocks"],
  },
  {
    slug: "hld",
    number: 5,
    title: "High-Level Design",
    tagline: "Designing real systems end to end",
    description:
      "A repeatable framework, then case studies: URL shortener, rate limiter, news feed, chat, notifications, payments, search.",
    stage: "scale",
    topics: ["Design framework", "Estimation", "URL shortener", "News feed", "Chat", "Payments"],
  },
  {
    slug: "lld",
    number: 6,
    title: "Low-Level Design",
    tagline: "Clean code at the class and API level",
    description: "SOLID, the patterns that matter, API and schema design, and classic LLD problems.",
    stage: "core",
    topics: ["SOLID", "Design patterns", "API design", "Schema design", "LLD problems"],
  },
  {
    slug: "cloud-infra",
    number: 7,
    title: "Cloud & Infrastructure",
    tagline: "Where your code actually runs",
    description: "Linux, containers, Kubernetes, CI/CD, core AWS services, VPC networking, IaC and cost.",
    stage: "scale",
    topics: ["Linux", "Containers", "Kubernetes", "CI/CD", "AWS core", "IaC"],
  },
  {
    slug: "reliability",
    number: 8,
    title: "Reliability & Operations",
    tagline: "Keeping it running at 3am",
    description: "Observability, SLOs, deployment strategies, incident response and postmortems.",
    stage: "scale",
    topics: ["Logs, metrics, traces", "SLOs", "Deploy strategies", "Incidents", "Postmortems"],
  },
  {
    slug: "security",
    number: 9,
    title: "Security",
    tagline: "Not getting owned",
    description: "OWASP essentials, secrets management, OAuth and OIDC, zero trust.",
    stage: "scale",
    topics: ["OWASP Top 10", "Secrets", "OAuth / OIDC", "Zero trust"],
  },
  {
    slug: "ai-native",
    number: 10,
    title: "AI-Native Engineering",
    tagline: "Building with and alongside AI",
    description:
      "How LLMs work, embeddings and vector DBs, RAG, agents and tool use, evals, AI system design and working with coding agents.",
    stage: "beyond",
    topics: ["LLM intuition", "Embeddings", "RAG", "Agents & MCP", "Evals", "AI system design"],
  },
  {
    slug: "career-ladder",
    number: 11,
    title: "Career Ladder",
    tagline: "Junior → Mid → Senior → Tech Lead",
    description:
      "What changes at each level, the skills that matter, and the evidence that gets you promoted.",
    stage: "beyond",
    topics: ["SDE1 → SDE2", "SDE2 → SDE3", "Senior → Tech Lead", "Promotions", "Interviews by level"],
  },
];

export const stages: { id: Track["stage"]; label: string; blurb: string }[] = [
  { id: "foundations", label: "Stage 1 · Foundations", blurb: "Understand the machine and the backend" },
  { id: "core", label: "Stage 2 · Core", blurb: "Data, building blocks and clean design" },
  { id: "scale", label: "Stage 3 · Scale", blurb: "Distributed, designed, deployed and kept alive" },
  { id: "beyond", label: "Stage 4 · Beyond", blurb: "AI-native work and growing as an engineer" },
];

export function getTrack(slug: string) {
  return tracks.find((t) => t.slug === slug);
}
