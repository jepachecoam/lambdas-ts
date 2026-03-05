# ARCHITECTURE.md — Lambda Architecture Reference

This document describes the anatomy of a single lambda in this repository:
how it is structured, how data flows through its layers, and what shared
infrastructure is available to use.

---

## Repository Layout

```
lambdas-ts/
├── src/
│   ├── lambdas/          # Independent lambda functions (one folder each)
│   │   └── example/      # Canonical 5-layer scaffold — use as starting point
│   └── shared/           # Utilities available to every lambda
├── index.ts              # Local Express dev server for running lambdas locally
├── AGENTS.md             # Coding conventions and rules
├── ARCHITECTURE.md       # This file
└── agent_docs/           # Detailed reference docs (shared utilities, DB patterns, new lambda guide)
```

Each lambda under `src/lambdas/` is **fully independent** — it is built, deployed,
and runs in isolation. No lambda imports from another lambda. All cross-cutting
concerns are handled via `src/shared/`.

---

## Anatomy of a Lambda — The 5-Layer Pattern

Every lambda in this repo follows a strict 5-layer structure. Each layer has a
single responsibility and a hard boundary.

```
src/lambdas/MyLambda/
├── index.ts        → Handler       (entry point only)
├── model.ts        → Business Logic
├── dao.ts          → Data Access
├── dto.ts          → Data Transformation
├── types.ts        → Type Definitions
├── utils.ts        → Utilities (optional)
└── conf/
    └── envs.ts     → Env Config (optional)
```

### Layer responsibilities

| File           | Layer                 | Responsibility                                                       | Hard boundary            |
| -------------- | --------------------- | -------------------------------------------------------------------- | ------------------------ |
| `index.ts`     | Handler               | Log event, `checkEnv()`, extract params, call Model, return response | No business logic        |
| `model.ts`     | Business Logic        | Orchestrate workflows, coordinate DAO calls                          | No direct DB/HTTP access |
| `dao.ts`       | Data Access           | All DB queries, HTTP calls, S3, SQS, Secrets Manager                 | No business logic        |
| `dto.ts`       | Data Transformation   | Parse/validate input, transform data, shape responses                | No DB calls              |
| `types.ts`     | Type Definitions      | Interfaces, enums, Zod schemas, constants                            | No executable code       |
| `utils.ts`     | Utilities (optional)  | Lambda-specific helper functions                                     | —                        |
| `conf/envs.ts` | Env Config (optional) | Eagerly-loaded env var constants                                     | No logic                 |

---

## Data Flow Through a Lambda

```
AWS Event (HTTP / SQS / S3 / Step Functions / ...)
  │
  ▼
index.ts
  ├── console.log("Event :>>>", ...)       ← always log the raw event first
  ├── checkEnv({ ...EnvsEnum, ...dbEnv })  ← fail fast if any env var is missing
  ├── new Model(envs.ENVIRONMENT)          ← instantiate with environment string
  ├── dto.extractParams(event)             ← parse and validate input
  ├── model.process(params)               ← delegate all work to the model
  │     │
  │     ├── [business logic]
  │     ├── this.dao.fetchSomething()     ← dao fetches data
  │     ├── [transform / decide]
  │     └── this.dao.writeSomething()     ← dao writes data
  │
  └── return httpResponse({ statusCode: 200, body: result })
        └── on catch → httpResponse({ statusCode: 500, body: err })
```

The `environment` string (`"dev"` | `"qa"` | `"prod"`) flows top-down:

```
index.ts → new Model(environment) → new Dao(environment) → new Database(environment)
```

This single value drives which DB credentials are loaded and how shared utilities
behave per environment.

---

## Canonical `index.ts` Pattern

```typescript
export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));
  try {
    checkEnv({ ...EnvsEnum, ...dbEnv });
    const model = new Model(envs.ENVIRONMENT);
    const params = dto.extractParams(event);
    const result = await model.process(params);
    console.log("Result =>>>", result);
    return httpResponse({ statusCode: 200, body: result });
  } catch (err) {
    console.error("Error in handler", err);
    return httpResponse({ statusCode: 500, body: err });
  }
};
```

**Exception — SQS-triggered lambdas:** must `throw err` in the catch block instead
of returning a 500. Throwing causes Lambda to return the message to the queue for
retry. Returning a 500 silently discards the message.

---

## Shared Infrastructure (`src/shared/`)

These modules are available to every lambda. For full usage details and code
examples, see `agent_docs/shared-utilities.md`.

| Module                            | What it provides                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `databases/sequelize.ts`          | MySQL via Sequelize. Reads → read-only replica. Writes → primary host. Env-aware. |
| `databases/dynamo.ts`             | DynamoDB wrapper (`getItem`, `putItem`, `deleteItem`).                            |
| `databases/cache.ts`              | Redis singleton via ioredis. Keys namespaced as `{key}-{environment}`.            |
| `databases/db-sm/sequelize-sm.ts` | MySQL via Sequelize with credentials from Secrets Manager.                        |
| `responses/http.ts`               | `httpResponse({ statusCode, body })` — serializes body to JSON string.            |
| `services/httpRequest.ts`         | Pre-configured Axios instance (`b2bRequest`) for internal microservice calls.     |
| `services/concurrency.ts`         | `executeWithLimit({ tasks, concurrencyLimit })` — p-limit + Promise.allSettled.   |
| `services/secretManager.ts`       | AWS Secrets Manager wrapper. Returns parsed JSON.                                 |
| `validation/envChecker.ts`        | `checkEnv<T>(EnvsEnum)` — throws if any required env var is missing.              |
| `types/database.ts`               | `EnvironmentTypes`, `dbEnv` (15 DB env var keys), `dbEnvSm` (SM-based DB keys).   |

---

## Key Architectural Invariants

These rules apply to every lambda without exception:

1. **No business logic in `index.ts`** — handler only: log, checkEnv, extract params, call model, return response.
2. **No DB access in `model.ts`** — all data access goes through `dao.ts`.
3. **All INSERT operations use `WHERE NOT EXISTS`** — idempotency guard against duplicate event delivery.
4. **`Promise.allSettled` for batch operations** — one record failure must never abort the entire batch.
5. **`environment` flows top-down** — index → Model constructor → Dao constructor → Database constructor.
6. **`checkEnv()` is always the first call in the handler** — fail fast before any logic runs.

---

## The `example` Lambda

`src/lambdas/example/` is the canonical scaffold. It contains all 5 layers with
inline comments explaining the rules for each file. Always copy it as the starting
point when creating a new lambda. See `agent_docs/new-lambda-guide.md` for the
full step-by-step process.
