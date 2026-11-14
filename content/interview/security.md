## How do you prevent SQL injection, XSS and CSRF?
> round: concepts | level: mid | lessons: security/web-vulnerabilities, backend-first-principles/validation

- **SQL injection**: user input changes the structure of a query. Use **parameterized queries** everywhere (prepared statements, ORM parameters), never string concatenation. For things that can't be parameters, like a sort column, **allowlist** the values.
- **XSS** (cross-site scripting): attacker-controlled content runs as script in another user's browser. Use **context-aware output escaping** (templating frameworks do this by default), sanitize any HTML you must allow, add a **Content Security Policy**, and keep session cookies **HttpOnly** so stolen script can't read them.
- **CSRF** (cross-site request forgery): another site makes the victim's browser send an authenticated request. Use **SameSite** cookies, **CSRF tokens** for cookie-authenticated forms, and never change state with a GET.

The general principle behind all three: never trust input, and keep data and code separate.

### A strong answer covers
- The mechanism of each attack in one sentence
- Parameterization, escaping/CSP, SameSite/tokens
- Allowlisting where parameters can't be used
- Defense in depth

### Likely follow-ups
- What is SSRF, and why is it dangerous in the cloud? (requests to internal metadata endpoints)

## How should you store user passwords?
> round: concepts | level: junior | lessons: security/passwords-and-mfa, security/secrets-and-encryption

**Hash** them with a slow, salted, tunable password-hashing algorithm: **Argon2id** (recommended), **bcrypt** or **scrypt**, with PBKDF2 where compliance requires it. Never store them in plain text, never **encrypt** them (encryption is reversible), and never use fast hashes like SHA-256 or MD5 alone, which attackers can try billions of times per second.

- A unique **salt** per password defeats precomputed tables and makes identical passwords hash differently.
- The **cost factor** is tuned so hashing is deliberately slow on your servers, and raised over time.
- **Upgrade old hashes** on login; wrap legacy fast hashes immediately.

Around storage: rate-limit login attempts, avoid revealing whether an email exists, check new passwords against known breached lists, make reset tokens single-use and short-lived, and support **MFA**, ideally passkeys/WebAuthn. Often the best option is a managed identity provider.

### A strong answer covers
- Hash, not encrypt; slow, salted algorithms by name
- Why fast hashes are dangerous
- Migrating old hashes
- Login protections and MFA

### Likely follow-ups
- Your database of password hashes leaks. What do you do?

## What's the difference between OAuth 2.0 and OpenID Connect, and which flow would you use?
> round: concepts | level: mid | lessons: security/oauth-and-oidc, backend-first-principles/authentication

**OAuth 2.0** is for **delegated authorization**: a user lets an app access an API on their behalf, and the app gets an **access token** with scopes. It doesn't, by itself, tell the app who the user is.

**OpenID Connect** adds **authentication** on top: an **ID token** stating who logged in. "Sign in with Google" is OIDC.

Flows:

- Users logging in (web, mobile, single-page apps): **Authorization Code with PKCE**.
- Service-to-service with no user: **Client Credentials**.

Validate tokens properly (issuer, audience, expiry, signature, scopes), and **never send an ID token to an API as an access credential**. In browsers, keep tokens out of JavaScript: a backend-for-frontend holding tokens server-side and using HttpOnly cookies is the safest pattern.

### A strong answer covers
- Authorization vs authentication; access token vs ID token
- Auth Code + PKCE, Client Credentials
- Token validation checklist
- Keeping tokens away from browser JavaScript

### Likely follow-ups
- What does PKCE protect against?

## How do you manage secrets like database passwords and API keys?
> round: concepts | level: mid | lessons: security/secrets-and-encryption, backend-first-principles/configuration-and-logging, security/supply-chain-and-zero-trust

- Keep them in a **secrets manager** (cloud secrets manager, Vault), **injected at runtime**, never in Git, container images or logs.
- Prefer **workload identity** (cloud IAM roles, OIDC from CI to the cloud) over long-lived static keys, so there's nothing to leak.
- **Rotate** them, and make rotation routine rather than an emergency.
- **Scan** repositories and CI for leaked secrets.
- Grant **least privilege**: each service gets only the secrets it needs.

For data: TLS everywhere, including internal hops; encryption at rest by default; field-level encryption for the most sensitive data, with keys managed in a **KMS** via envelope encryption.

### A strong answer covers
- Secrets manager + runtime injection
- Workload identity over static keys
- Rotation, scanning, least privilege
- Encryption in transit and at rest

### Likely follow-ups
- A developer accidentally committed an API key to a public repository. What are the steps?

## How would you threat-model a new feature?
> round: concepts | level: senior | lessons: security/security-mindset, security/api-security

Answer four questions:

1. **What are we building?** Draw the data flow and mark the **trust boundaries**: where data crosses from users, third parties or other services into yours.
2. **What can go wrong?** Walk each boundary with **STRIDE**: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege. Include **abuse cases** of ordinary features (a referral bonus farmed with fake accounts, an export endpoint scraping everyone's data).
3. **What will we do about it?** Mitigate, accept, or transfer each risk, with owners.
4. **Did we do a good job?** Verify with tests and reviews.

Principles to apply throughout: least privilege, defense in depth, secure defaults, minimal attack surface, never trust input. For APIs specifically, the most common real bug is **broken object-level authorization**: always check the caller may access *this* object.

### A strong answer covers
- The four questions and data-flow/trust boundaries
- STRIDE by name, plus abuse cases
- Concrete mitigations with owners
- Putting it in the design doc

### Likely follow-ups
- Threat-model a "share this document via link" feature.
