## What is RAG, and why do RAG systems give bad answers?
> round: concepts | level: mid | lessons: ai-native/rag, ai-native/embeddings-and-vector-search

**Retrieval-augmented generation**: at query time, retrieve the most relevant chunks from your own data, put them in the model's context, and have it answer **from those chunks, with citations**. It grounds the model in current, private data without retraining it.

Most bad answers are **retrieval failures**, not model failures: the right text never reached the context. Common causes and fixes:

- **Chunking**: chunks that split an answer in half or mix topics. Chunk by structure, with overlap and metadata.
- **Search quality**: pure vector search misses exact terms (error codes, names). Use **hybrid search** (keyword + vector) and a **reranker**.
- **Freshness**: stale indexes. Re-index on change.
- **Permissions**: filter by what the user may see **before** generation, never after.

Evaluate the two halves separately: retrieval (did the right chunks come back? recall@k) and generation (is the answer faithful to them?).

### A strong answer covers
- Retrieve → augment → generate with citations
- Retrieval as the usual failure point
- Hybrid search, reranking, chunking
- Permission filtering and separate evaluation

### Likely follow-ups
- How would you build an evaluation set for a RAG feature?
- When would you choose a long context window over retrieval?

## How do you test or evaluate an LLM-powered feature?
> round: concepts | level: mid | lessons: ai-native/evals, ai-native/prompting-for-engineers

An **eval** is a dataset + a grader + a score you track over time, run on every change to the prompt, model or retrieval, like a test suite.

- **Dataset**: real user inputs, edge cases, adversarial inputs, and every production failure you find (each one becomes a permanent case).
- **Graders**: prefer **code-based** checks where possible (valid JSON, schema, contains the required fact, correct tool chosen). Use an **LLM judge** for semantic qualities like faithfulness or tone, calibrated against human ratings. Use **humans** to calibrate and for spot checks.
- **Track** scores per version, so you can see a regression before users do.

Online, keep monitoring quality: user feedback, sampled reviews, and guardrail hit rates. And treat prompts like code: versioned, tested and logged.

### A strong answer covers
- Dataset + grader + tracked score
- Where the dataset comes from (including production failures)
- Code graders first, calibrated LLM judges second
- Running evals on every change, plus online monitoring

### Likely follow-ups
- How do you know your LLM judge is trustworthy?

## What is prompt injection, and how do you defend against it?
> round: concepts | level: senior | lessons: ai-native/llm-security, ai-native/tool-use-and-agents

**Prompt injection** is when text the model reads overrides your instructions. **Direct**: a user types "ignore previous instructions". **Indirect**: the model reads a web page, email or document that contains hidden instructions, which is far more dangerous in agents with tools.

It **can't be fully prevented with prompts**, so design around it:

- **Least-privilege tools**, scoped to the current user's permissions. The model should never be able to do more than the user could.
- **Human approval** for consequential actions (sending, paying, deleting).
- **Treat model output as untrusted**: escape it before rendering, validate it before executing, allowlist actions.
- Be very careful combining **private data + untrusted content + a way to send data out** in one agent. That combination enables data exfiltration.

### A strong answer covers
- Direct vs indirect injection
- Why prompt-level defenses aren't enough
- Least privilege, approvals, output validation
- The private data + untrusted content + exfiltration combination

### Likely follow-ups
- An email assistant reads incoming mail and can send replies. What could go wrong?

## How would you design an LLM feature to handle cost, latency and outages at scale?
> round: hld | level: senior | lessons: ai-native/llm-system-design, ai-native/how-llms-work

Treat the model as a **slow, expensive, rate-limited and variable dependency**, like any risky external API.

- **An LLM gateway** in front of providers: authentication, per-team quotas, routing between models, caching, retries with backoff, fallbacks, and observability (tokens, cost, latency per feature).
- **Cost levers**: tokens drive cost, so trim context size, use **prompt caching** for repeated prefixes, **route** simple tasks to smaller models, cap output length, and batch offline work.
- **Latency**: **stream** responses for perceived speed; move non-interactive work to async jobs.
- **Resilience**: timeouts, fallback to another model or a non-AI path, and graceful degradation when the provider is down or rate-limiting.

### A strong answer covers
- LLM as a risky dependency
- A gateway with quotas, routing, caching, observability
- Concrete cost levers
- Streaming, async and fallbacks

### Likely follow-ups
- How would you attribute LLM spend to individual features or customers?

## When would you build an agent instead of a fixed workflow?
> round: concepts | level: mid | lessons: ai-native/tool-use-and-agents, ai-native/mcp

With **tool use**, the model asks to call a function and *your code* executes it with real permissions. An **agent** is an LLM calling tools in a loop until it reaches a goal.

Prefer a **workflow** (fixed steps, with the LLM doing specific parts) when the steps are known: it's cheaper, faster, more predictable and easier to test. Use an **agent** when the path genuinely can't be known in advance, such as open-ended research or debugging.

Good tools: clear descriptions, narrow scope, concise results, safe defaults, permission enforcement in code, and approvals for consequential actions. **MCP** (Model Context Protocol) standardizes how AI applications connect to tools and data, so a tool server built once works across many AI apps.

### A strong answer covers
- Tool use mechanics: the model requests, your code executes
- Workflow vs agent, with a reason to prefer workflows
- What makes a good tool
- MCP as the integration standard

### Likely follow-ups
- How do you stop an agent from looping forever or running up costs?
