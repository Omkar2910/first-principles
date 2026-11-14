## How is a container different from a virtual machine, and what makes a good Dockerfile?
> round: concepts | level: mid | lessons: cloud-infra/containers-docker, cloud-infra/linux-for-backend-engineers

A **virtual machine** emulates hardware and runs its own kernel. A **container** is just a process on the host, isolated with Linux **namespaces** (what it can see) and **cgroups** (how much CPU and memory it can use), started from a layered image. Containers share the host kernel, so they start in milliseconds and are light, but the isolation is weaker than a VM's.

A good Dockerfile:

- **Multi-stage build**: compile in a full build image, copy only the artifact into a slim runtime image.
- **Slim base** image, rebuilt regularly and scanned for vulnerabilities.
- **Order layers by how often they change**: dependencies before source code, so most builds hit the cache.
- Run as a **non-root** user.
- **Exec-form** entrypoint (`ENTRYPOINT ["java", "-jar", "app.jar"]`), so your process receives SIGTERM directly and can shut down gracefully.
- **No secrets** in the image; inject them at runtime.

### A strong answer covers
- Namespaces + cgroups, shared kernel
- Multi-stage, slim, layer ordering
- Non-root and exec form, and why each matters
- Secrets out of images; scanning

### Likely follow-ups
- Your container keeps restarting with exit code 137. What does that mean? (killed, often by the out-of-memory killer)
- Why might a container be slow even though the host has idle CPU? (CPU throttling from cgroup limits)

## Walk me through what Kubernetes does when you deploy a new version.
> round: concepts | level: mid | lessons: cloud-infra/kubernetes, backend-first-principles/production-readiness

Kubernetes is declarative: you change the **desired state** (a Deployment with a new image tag), and controllers continuously **reconcile** the actual state toward it.

For a rolling update, the Deployment creates a new ReplicaSet and gradually shifts pods:

1. New pods are scheduled onto nodes with enough **requested** CPU and memory.
2. They start; the **readiness probe** gates traffic, so a pod only joins the Service's endpoints once ready.
3. Old pods are terminated: they're removed from endpoints and sent **SIGTERM**. A `preStop` delay lets load balancers stop routing to them before the app begins shutting down; the app drains in-flight requests and exits within the grace period.
4. The rollout continues until all replicas run the new version; you can roll back to the previous ReplicaSet.

Supporting pieces: a **Service** gives a stable name and IP across changing pods; an **Ingress** handles HTTP entry; a **HorizontalPodAutoscaler** adjusts replicas. When something goes wrong, `kubectl describe` and its events are the first stop.

### A strong answer covers
- Desired state and reconciliation
- Readiness gating new pods
- SIGTERM, preStop and graceful drain for old pods
- Requests/limits and probes configured correctly

### Likely follow-ups
- Pods are stuck in `Pending`. What could cause it?
- What's the difference between resource requests and limits?

## Design the network for a three-tier web application in the cloud.
> round: concepts | level: mid | lessons: cloud-infra/cloud-networking, cloud-infra/what-is-the-cloud

Use a **VPC** spread across **at least two availability zones**, with subnets per tier in each zone:

- **Public subnets**: only the load balancer (and NAT gateways). Routed to an internet gateway.
- **Private subnets**: the application servers. No inbound access from the internet; outbound via a **NAT gateway** for updates and third-party APIs.
- **Data subnets**: databases and caches, reachable only from the app tier.

Control traffic with **security groups** that reference each other: the database allows port 5432 **from the app's security group**, not from an IP range. Security groups are stateful (return traffic is allowed automatically); network ACLs are a stateless, coarser extra layer.

Use **VPC endpoints** to reach cloud services (object storage, secrets) without going through NAT, and watch NAT and cross-zone data transfer costs. To debug connectivity, go in order: DNS → routes → security groups → NACLs → is the service actually listening.

### A strong answer covers
- Multi-AZ with public / private / data subnets
- Only the load balancer is public
- Security groups referencing security groups
- NAT for outbound, endpoints for cloud services, and their costs

### Likely follow-ups
- An app server can't reach the database. How do you debug it?

## When would you choose serverless functions over containers?
> round: concepts | level: mid | lessons: cloud-infra/serverless-and-cost, cloud-infra/aws-core-services

**Serverless** (Lambda and similar) means no servers to manage, automatic scaling (including to zero) and paying per invocation. It shines for **spiky or event-driven** work: reacting to file uploads, queue messages, webhooks, scheduled tasks, low-traffic APIs.

Watch out for:

- **Cold starts** adding latency to the first request on a new instance.
- **Limits** on execution time, memory and payload size.
- **Downstream connections**: a burst can open thousands of database connections at once.
- **Cost at steady high load**: per-request pricing can cost more than always-on containers.

**Containers** suit steady, high-throughput or long-running services, and give more control over the runtime.

A useful habit: track **unit economics** (cost per request, per customer) and put the cost estimate in the design doc.

### A strong answer covers
- What serverless is good at
- Cold starts, limits, connection storms
- Cost crossover at steady load
- Unit economics

### Likely follow-ups
- How would you protect a relational database from a Lambda traffic spike?

## What does a good CI/CD pipeline look like?
> round: concepts | level: mid | lessons: cloud-infra/ci-cd, reliability/deployment-strategies, cloud-infra/infrastructure-as-code

- **CI**: every change is built and tested automatically (unit, integration, lint, security scans) before merge.
- **Build once, promote the same artifact**: the exact image tested in staging is what reaches production, configured per environment. Never rebuild per environment.
- **Everything as code**: pipelines, infrastructure (Terraform/OpenTofu), configuration, with reviewable plans.
- **Safe releases**: small changes, progressive rollout (canary), automated rollback on bad metrics, and **feature flags** to separate deploy from release.
- **Trunk-based development** with short-lived branches, and **backward-compatible migrations** so rollbacks stay safe.

To measure it, use DORA's metrics: throughput (change lead time, deployment frequency, failed deployment recovery time) and instability (change fail rate, deployment rework rate). The research finding is that speed and stability improve together, not at each other's expense.

### A strong answer covers
- CI on every change; build once, promote
- Infrastructure and pipelines as code
- Progressive delivery and feature flags
- DORA metrics as the measure

### Likely follow-ups
- A deploy breaks production. What should the pipeline have done?
