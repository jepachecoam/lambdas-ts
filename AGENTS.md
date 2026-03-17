# AGENTS.md — Coding Agent Guidelines

## Repository Overview

Monorepo of AWS Lambda functions in TypeScript. Each lambda lives under
`src/lambdas/<Lambda-Name>/` and is bundled independently with `@vercel/ncc`.
Shared utilities live in `src/shared/`.

---

## Scope of Work

**Work is always scoped to a single lambda at a time.**

- Only modify files inside the lambda folder you are currently working on.
- `src/shared/` and all other lambda folders are **read-only** unless the user
  explicitly asks for a change outside the current lambda.
- If a task seems to require modifying shared utilities or another lambda, stop
  and ask the user before proceeding.
- Before starting any task, read the lambda's `README.md` first.

## Mandatory Pre-Modification Protocol

Before modifying **any** existing code, you must:

1. Read and analyse the current implementation thoroughly.
2. Identify the affected layers (index / model / dao / dto / types).
3. Present a clear modification plan before writing code.

Exceptions: typo fixes, adding log lines, documentation-only changes, or when the
user explicitly requests immediate implementation.

---

## Reference Documents

Load the relevant doc from `agent_docs/` when the task requires it.
Do not load all docs upfront — only what the current task needs.

| Document                          | Load when...                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| `agent_docs/architecture.md`      | Starting any task, understanding structure, or data flow     |
| `agent_docs/code-style.md`        | Writing new code, refactoring, or checking naming/formatting |
| `agent_docs/error-handling.md`    | Writing try/catch, handling SQS events, or adding logging    |
| `agent_docs/shared-utilities.md`  | Using any module from `src/shared/`                          |
| `agent_docs/database-patterns.md` | Writing SQL queries or any DB access code                    |
| `agent_docs/new-lambda-guide.md`  | Creating a new lambda from scratch                           |

## Skills

Load the relevant skill from `agent_docs/skills/` when the task requires it.
Skills are practical guides — load them before writing any code for that domain.

| Skill                          | Load when...                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `agent_docs/skills/testing.md` | Creating or modifying test files, adding a `__tests__/` folder to any lambda |

### Rules for skills

- Load the skill **before** writing any test code, not after.
- Follow every rule in the skill without exception.
- If a task involves both writing code and writing tests, load both the relevant
  `agent_docs/` document and `agent_docs/skills/testing.md`.
