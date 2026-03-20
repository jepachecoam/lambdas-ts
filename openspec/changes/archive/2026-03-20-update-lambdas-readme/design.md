## Context

The repository contains 15 lambda functions. One of them (`b2c-auth`) already has a README that correctly describes the lambda at a conceptual level — what it does, its responsibilities, its flow, and its internal layers — without leaking implementation details. The remaining 14 have READMEs in varying styles, most of them written as developer references with JSON structures, environment variable tables, SQL schemas, and code snippets.

This design governs how to rewrite those 14 READMEs consistently.

## Goals / Non-Goals

**Goals:**

- Establish a single, repeatable README structure applicable to all lambdas.
- Make each README self-contained: a reader should understand what the lambda does and why it exists without reading the source code.
- Use `b2c-auth/README.md` as the canonical template and style guide.

**Non-Goals:**

- Modifying any source code.
- Creating new documentation beyond the README files.
- Documenting infrastructure, deployment pipelines, or CI/CD.
- Adding content that isn't already inferrable from reading the existing README and source code of each lambda.

## Decisions

### Decision 1: Use `b2c-auth` as the canonical structure

The `b2c-auth` README has the exact style we want: short, purpose-driven sections with no technical noise. Every rewritten README will follow its section structure:

1. **`# <lambda-name>`** — title
2. **`## Purpose`** — one paragraph: what this lambda is and its sole responsibility
3. **`## What it does`** — one paragraph: what it receives, what it processes, and what it produces
4. **`## <Flow section>`** — numbered list of conceptual steps (e.g. "Authorization flow", "Processing flow", "Reconciliation flow"). The section title should reflect the lambda's domain.
5. **`## <Output/Result section>`** (optional, only when relevant) — what the lambda emits, enriches, or produces on success
6. **`## Internal layers`** — bullet list mapping each file to its conceptual role (no variable names, no type names)

**Alternative considered**: A more generic template with fewer sections. Rejected because the `b2c-auth` structure is already proven and specific enough to be useful without being prescriptive.

### Decision 2: Read source code when the existing README is insufficient

For lambdas whose existing README lacks enough conceptual information (e.g. it only documents inputs/outputs mechanically), the implementer must read the source code to understand the conceptual behavior before writing. The README must reflect what the lambda _does_, not what its code _looks like_.

### Decision 3: One README rewrite per task

Each lambda is an independent unit of work. Tasks are defined one per lambda to allow clear progress tracking and parallel review if needed.

### Decision 4: No content that names internal identifiers

The following are explicitly forbidden in any rewritten README:

- Variable names, constant names, or enum values
- Database table or column names
- HTTP path strings or query parameter names
- JSON field names
- AWS resource names or ARN patterns
- Internal class, function, or method names
- Environment variable names

These belong in the source code or in developer-facing runbooks, not in conceptual documentation.

## Risks / Trade-offs

**Risk: Losing useful technical detail** → Some engineers rely on the current READMEs as quick references for things like environment variable names or JSON structures. That information will no longer be in the README.
_Mitigation_: The source code and `types.ts` / `conf/envs.ts` files remain the canonical reference for those details. The README is not the right place for them.

**Risk: Conceptual descriptions becoming vague** → Without implementation anchors, a README could become too abstract to be useful.
_Mitigation_: The `b2c-auth` README is the reference. If a sentence could describe any lambda, it's too vague. Each README must be specific enough that you could identify the lambda from the README alone.

**Risk: Inconsistent quality across 14 rewrites** → Different authors (or multiple passes) could produce uneven results.
_Mitigation_: The spec defines explicit criteria for what makes a README acceptable. Each rewrite should be validated against those criteria before the task is marked complete.
