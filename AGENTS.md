# AGENTS.md — Coding Agent Guidelines

This file provides context and conventions for AI coding agents working in this repository.

---

## Repository Overview

A monorepo of AWS Lambda functions written in TypeScript. Each lambda lives under
`src/lambdas/<Lambda-Name>/` and is bundled independently with `@vercel/ncc`.
Shared utilities live in `src/shared/`.

---

## Build / Lint / Dev Commands

```bash
# Start local Express dev server (maps every lambda to a POST route)
npm run dev                # → ts-node-dev index.ts

# Bundle a single lambda interactively
npm run build              # → bash ./build-lambda.sh (prompts for lambda name)

# Lint all staged files (also runs automatically on pre-commit)
npx lint-staged

# Lint a specific file manually
npx eslint --fix src/lambdas/<Lambda-Name>/index.ts

# Format a specific file manually
npx prettier --write src/lambdas/<Lambda-Name>/index.ts
```

### Running Tests

**No test framework (Jest/Vitest) is installed.** Tests are custom hand-rolled scripts
co-located with their source file (e.g., `model.test.ts` next to `model.ts`).

Run a single test file with:

```bash
npx ts-node src/lambdas/<Lambda-Name>/model.test.ts
```

The `npm test` script is a placeholder stub (`exit 1`). Do not rely on it.

---

## Pre-commit Hook

Husky runs `lint-staged` before every commit:

- `eslint --cache --fix --max-warnings 0` on all `*.ts` / `*.js` staged files
- `prettier --write` on all `*.ts` / `*.js` staged files

Zero ESLint warnings are tolerated on commit.

---

## Mandatory Pre-Modification Protocol

Before modifying **any** existing code, you must:

1. Read and analyse the current implementation thoroughly.
2. Identify the affected layers (index / model / dao / dto / types).
3. Present a clear modification plan before writing code.

Exceptions: typo fixes, adding log lines, documentation-only changes, or when the user
explicitly requests immediate implementation.

---

## Lambda Architecture (Strict 5-Layer Pattern)

Every lambda **must** follow this structure:

| File           | Layer                 | Responsibility                                                                                                                            |
| -------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`     | Handler               | Entry point only: log event, `checkEnv()`, extract params via DTO, instantiate Model, call Model, return response. **No business logic.** |
| `model.ts`     | Business Logic        | Orchestrate workflows, coordinate DAO calls. **No direct DB access.** Export as `export default class Model`.                             |
| `dao.ts`       | Data Access           | All DB queries, HTTP calls, S3, SQS, Secrets Manager. **No business logic.** Export as `export default class Dao`.                        |
| `dto.ts`       | Data Transformation   | Parse/validate input, transform data, generate responses. Export as `export default { ... }` plain object.                                |
| `types.ts`     | Type Definitions      | Interfaces, enums, Zod schemas, constants only. **No executable code.**                                                                   |
| `utils.ts`     | Utilities (optional)  | Lambda-specific helper functions.                                                                                                         |
| `conf/envs.ts` | Env Config (optional) | Eagerly-loaded env var constants for the lambda.                                                                                          |

Both `Model` and `Dao` receive `environment: string` (`"dev"` | `"qa"` | `"prod"`) in
their constructors and pass it through to shared database helpers.

### Canonical `index.ts` Pattern

```typescript
export const handler = async (event: any, context: any) => {
  console.log("Event :>>>", JSON.stringify(event));
  try {
    checkEnv({ ...EnvsEnum, ...dbEnv });
    const model = new Model(envs.ENVIRONMENT);
    const params = dto.extractParams(event);
    const result = await model.process(params);
    return utils.response({ statusCode: 200, body: result });
  } catch (err) {
    console.error("Error in handler", err);
    return utils.response({ statusCode: 500, body: err });
  }
};
```

---

## TypeScript Configuration

- **Target**: `es2016`, **Module**: `commonjs`
- **Strict mode**: `strict: true`, `noImplicitAny: true`
- `noUnusedLocals` and `noUnusedParameters` are both `false`
- `noPropertyAccessFromIndexSignature: true` — use bracket notation for index signatures
- `esModuleInterop: true`
- No path aliases — use relative imports everywhere

---

## Code Style

### Formatting (Prettier)

```json
{
  "semi": true,
  "arrowParens": "always",
  "singleQuote": false,
  "trailingComma": "none"
}
```

- **Double quotes** for all strings and imports
- **Semicolons** always required
- **No trailing commas** — not even in multi-line arrays/objects
- Arrow functions always have parentheses: `(x) => x`
- Spaces only — no tabs (`no-tabs: error`)
- Opening brace on same line (`brace-style: 1tbs`)
- Spaces inside object braces: `{ key: value }`

### Imports

- Imports are **sorted automatically** by `eslint-plugin-simple-import-sort` (enforced as error).
- Third-party packages come before local imports; within each group, alphabetical order.
- No `.ts` extension in import paths.
- No duplicate imports from the same module.
- One `const`/`let` declaration per statement (`one-var: never`).

```typescript
// Correct import order (sorted, double quotes, no .ts extension)
import axios from "axios";
import { z } from "zod";

import Database from "../../shared/databases/sequelize";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import { EnvsEnum, IRecordData } from "./types";
```

### Naming Conventions

| Construct           | Convention                | Example                           |
| ------------------- | ------------------------- | --------------------------------- |
| Classes             | `PascalCase`              | `Model`, `Dao`, `CacheDB`         |
| Interfaces          | `I` + `PascalCase`        | `IRecordData`, `IShipmentStatus`  |
| Enums (name)        | `PascalCase`              | `EnvsEnum`, `OrderSources`        |
| Enum values         | `SCREAMING_SNAKE_CASE`    | `BASE_URL_MS`, `ORDER_APPROVED`   |
| Functions/variables | `camelCase`               | `fetchRecords`, `orderId`         |
| DB entity IDs       | `id` prefix + camelCase   | `idOrder`, `idUser`, `idBusiness` |
| Lambda folders      | `PascalCase` with hyphens | `Mastershop-UpdateOrders`         |
| Environment string  | literal union             | `"dev"`, `"qa"`, `"prod"`         |

### Classes and Methods

Methods in `Model` and `Dao` are defined as **arrow function class properties** (not
prototype methods) to preserve `this` binding:

```typescript
class Model {
  private environment: string;
  private dao: Dao;

  constructor(environment: string) {
    this.environment = environment;
    this.dao = new Dao(environment);
  }

  processRecords = async ({ records }: IProcessInput) => {
    // ...
  };
}

export default Model;
```

### Error Handling

- Always wrap handler logic in `try/catch`; return a 500 response on error — never throw
  out of the handler.
- In `Model`/`Dao` methods, `catch` the error, `console.error` it, then re-throw so the
  handler catches it.
- Use `Promise.allSettled` for parallel operations to avoid one failure crashing the batch.
- Only throw `Error` objects — never throw literals (`no-throw-literal: error`).
- Use strict equality (`===`) everywhere; `== null` is acceptable for null/undefined checks.

```typescript
// model.ts / dao.ts pattern
fetchData = async (params: IParams) => {
  try {
    return await this.dao.query(params);
  } catch (error) {
    console.error("Error in fetchData:", error);
    throw error;
  }
};
```

### Logging

`console` is fully allowed. Use these conventions:

```typescript
console.log("Event :>>>", JSON.stringify(event)); // handler entry
console.log("Result =>>>", result); // data inspection
console.error("Error processing order", error); // errors
console.warn("Missing optional field, skipping"); // non-fatal warnings
```

### Environment Variables

- Define all required env var keys in an `EnvsEnum` inside `types.ts`.
- Load them eagerly in `conf/envs.ts` using `process.env[EnvsEnum.KEY]!` (non-null assertion).
- Call `checkEnv({ ...EnvsEnum, ...dbEnv })` at the top of the handler to fail fast on
  missing vars before any logic runs.

### Validation

- Use **Zod** for input/payload schema validation. Co-locate schemas in `types.ts`.
- Prefer `schema.safeParse()` for graceful failure; log `result.error` before returning.
- Use the shared `checkEnv<T>()` generic for environment variable validation.

---

## Shared Utilities (`src/shared/`)

| Module                      | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `databases/sequelize.ts`    | MySQL via Sequelize — `fetchMany`, `fetchOne`, `execute` |
| `databases/dynamo.ts`       | DynamoDB wrapper                                         |
| `databases/cache.ts`        | Redis singleton via ioredis                              |
| `responses/http.ts`         | `httpResponse({ statusCode, body })` helper              |
| `services/httpRequest.ts`   | Axios instance (`b2bRequest`)                            |
| `services/concurrency.ts`   | `executeWithLimit()` using `p-limit`                     |
| `services/secretManager.ts` | AWS Secrets Manager wrapper                              |
| `validation/envChecker.ts`  | `checkEnv<T>()` — throws if any env var is missing       |

---

## Key Dependencies

- **AWS SDK v3**: `@aws-sdk/client-dynamodb`, `client-s3`, `client-sqs`, `client-sfn`,
  `client-secrets-manager`, `client-bedrock-runtime`
- **Database**: `sequelize` + `mysql2`, `ioredis`
- **Validation**: `zod`, `ajv`
- **HTTP**: `axios`
- **Auth**: `aws-jwt-verify`, `jsonwebtoken`, `jwks-rsa`
- **Build**: `@vercel/ncc` (bundles to `dist/index.js` per lambda)

---

## Known Deviations

The patterns below exist in production code and are **intentional exceptions**, not bugs.
Do not "fix" them to match the canonical patterns in this file.

### `model.ts` — prototype methods vs. arrow function properties

The spec requires arrow function class properties (`process = async () => {}`).
Some older lambdas use regular prototype methods (`async process() {}`).
Both are valid TypeScript. When modifying an existing lambda, preserve the style
already used in that file. Use arrow function properties for all new code.

Affected lambdas: `b2b-auth`, `reconciliation-mastershop-orderReconciliationAnomalyChecker`

### `dto.ts` — static class vs. plain object export

The spec says `export default { ... }` (plain object).
Some lambdas export a class with static methods: `export default class Dto { static method() {} }`.
Both compile identically at the call site. Preserve the style already in the file.

Affected lambdas: `Mastershop-UpdateOrders`, `reconciliation-mastershop-orderReconciliationAnomalyChecker`

### `index.ts` — `throw err` vs. `return httpResponse({ statusCode: 500 })`

Some SQS-triggered lambdas intentionally `throw err` in the handler catch block.
This is correct for SQS triggers: throwing causes Lambda to return the message to the
queue for retry. Returning a 500 response would silently discard the message.
HTTP-triggered lambdas must always return a 500 response and never throw.

Affected lambdas: `reconciliation-mastershop-orderReconciliationAnomalyChecker`

### `b2b-auth/index.ts` — no `checkEnv()` call

This lambda is an API Gateway authorizer and does not use the database.
It skips `checkEnv()` deliberately because `dbEnv` vars are not present in that
Lambda's environment. This is a valid exception to the fail-fast pattern.

### `Mastershop-UpdateOrders/dao.ts` — local `utils.httpRequest` instead of shared `b2bRequest`

The UpdateOrders lambda uses a locally-defined Axios wrapper (`utils.httpRequest`)
that returns `null` on any HTTP error instead of throwing. This is intentional:
HTTP failures for individual records must be non-fatal. Do not replace it with the
shared `b2bRequest` instance, which throws on error.

---

## Critical Warnings (Landmines)

Things that will break correctness, idempotency, or production safety if changed.
Read this section before modifying any of the listed areas.

### Never remove `WHERE NOT EXISTS` from INSERT queries

All `INSERT` statements use `WHERE NOT EXISTS` subqueries to guarantee idempotency.
SQS delivers messages **at-least-once** — duplicate deliveries are expected.
Removing this guard will create duplicate rows in production.

Affected tables: `orderShipmentUpdateHistory`, `orderReturnShipmentUpdateHistory`,
`orderReturn`, `orderReturnStatusLog`, `orderLeg`, `orderReturnLeg`.

### Never shorten the 30-second retry delay in `Mastershop-UpdateOrders`

The lambda retries records not found in the DB up to 3 times with a 30-second delay.
This delay exists because carrier events can arrive before the order is written to the
DB (race condition). Shortening the delay will cause valid records to fail permanently.

Location: `src/lambdas/Mastershop-UpdateOrders/model.ts`

### Never skip the two-step `idStatus = 8` transition in `Mastershop-UpdateOrders`

Transitioning an order to `idStatus = 8` requires first setting `idStatus = 6`
("En Tránsito") if the current status is neither 6 nor 8. Skipping the intermediate
step breaks the status history trail in the Mastershop platform.

Location: `src/lambdas/Mastershop-UpdateOrders/model.ts` → `updateOrder`

### Never modify `carrierStatusUpdate` or `status` table rows directly

These tables are the source of truth for carrier status code translation. Changes must
go through the Mastershop admin interface, not SQL. Direct modifications will silently
break status updates for all carriers.

### Never disable the `tls: {}` option in `CacheDB` for production

`src/shared/databases/cache.ts` enables TLS for all Redis connections via `tls: {}`.
This is required for the production Redis instance. Only comment it out in local dev
(the comment in the file says so). Never remove it from committed code.

### `b2b-auth` DynamoDB table names are environment-suffixed

The `B2BAccessControl` table is named `B2BAccessControl-Dev` in dev and
`B2BAccessControl` in prod/qa. The suffix is applied dynamically in `dao.ts`.
Do not hardcode the table name without the environment check.

Location: `src/lambdas/b2b-auth/dao.ts`

---

## Reference Documents

For detailed context on specific topics, read the relevant file in `agent_docs/`
before beginning work. Do not try to infer this information from reading source files.

| Document                          | When to read it                                |
| --------------------------------- | ---------------------------------------------- |
| `agent_docs/shared-utilities.md`  | Before using any module from `src/shared/`     |
| `agent_docs/database-patterns.md` | Before writing any SQL query or DB access code |
| `agent_docs/new-lambda-guide.md`  | Before creating a new lambda from scratch      |
