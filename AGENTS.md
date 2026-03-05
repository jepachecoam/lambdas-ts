# AGENTS.md — Coding Agent Guidelines

This file provides the essential conventions for AI coding agents working in this repository.

---

## Repository Overview

A monorepo of AWS Lambda functions written in TypeScript. Each lambda lives under
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

When you need context about the current lambda, read its `README.md` first.
When you need context about conventions or shared utilities, read the relevant
file in `agent_docs/`.

---

## Build / Lint / Dev Commands

```bash
# Start local Express dev server (maps every lambda to a POST route)
npm run dev

# Bundle a single lambda interactively
npm run build

# Lint a specific file manually
npx eslint --fix src/lambdas/<Lambda-Name>/index.ts

# Format a specific file manually
npx prettier --write src/lambdas/<Lambda-Name>/index.ts

# Run a hand-rolled test file
npx ts-node src/lambdas/<Lambda-Name>/model.test.ts
```

The `npm test` script is a placeholder stub (`exit 1`). Do not rely on it.

---

## Pre-commit Hook

Husky runs `lint-staged` before every commit:

- `eslint --cache --fix --max-warnings 0` on all staged `*.ts` / `*.js` files
- `prettier --write` on all staged `*.ts` / `*.js` files

Zero ESLint warnings are tolerated on commit.

---

## Mandatory Pre-Modification Protocol

Before modifying **any** existing code, you must:

1. Read and analyse the current implementation thoroughly.
2. Identify the affected layers (index / model / dao / dto / types).
3. Present a clear modification plan before writing code.

Exceptions: typo fixes, adding log lines, documentation-only changes, or when the
user explicitly requests immediate implementation.

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
- Spaces only — no tabs
- Opening brace on same line (`1tbs`)
- Spaces inside object braces: `{ key: value }`

### Imports

- Sorted automatically by `eslint-plugin-simple-import-sort` (enforced as error).
- Third-party packages before local imports; alphabetical within each group.
- No `.ts` extension in import paths.
- No duplicate imports from the same module.
- One `const`/`let` declaration per statement.

```typescript
import axios from "axios";
import { z } from "zod";

import Database from "../../shared/databases/sequelize";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import { EnvsEnum } from "./types";
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
| Lambda folders      | `PascalCase` with hyphens | `Domain-Purpose`                  |
| Environment string  | literal union             | `"dev"`, `"qa"`, `"prod"`         |

### Classes and Methods

Methods in `Model` and `Dao` are defined as **arrow function class properties**:

```typescript
class Model {
  private environment: string;
  private dao: Dao;

  constructor(environment: string) {
    this.environment = environment;
    this.dao = new Dao(environment);
  }

  processRecords = async (params: IProcessInput) => {
    // ...
  };
}

export default Model;
```

**When modifying an existing lambda:** if the file already uses prototype methods,
preserve that style. Do not convert existing code to arrow function properties.

### Error Handling

- Always wrap handler logic in `try/catch`; return a 500 response on error.
- **Exception:** SQS-triggered lambdas must `throw err` so the message returns to
  the queue for retry. Check the lambda's `README.md` to confirm its trigger type.
- In `Model`/`Dao` methods, catch the error, `console.error` it, then re-throw.
- Use `Promise.allSettled` for parallel operations — one failure must not abort the batch.
- Only throw `Error` objects — never throw literals.
- Use strict equality (`===`); `== null` is acceptable for null/undefined checks.

```typescript
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

```typescript
console.log("Event :>>>", JSON.stringify(event)); // handler entry
console.log("Result =>>>", result); // data inspection
console.error("Error processing record", error); // errors
console.warn("Missing optional field, skipping"); // non-fatal warnings
```

### Environment Variables

- Define all required env var keys in an `EnvsEnum` inside `types.ts`.
- Load them eagerly in `conf/envs.ts` using `process.env[EnvsEnum.KEY]!`.
- Call `checkEnv({ ...EnvsEnum, ...dbEnv })` at the top of the handler to fail fast.
  Omit `dbEnv` if the lambda does not use the database.

### Validation

- Use **Zod** for input/payload schema validation. Co-locate schemas in `types.ts`.
- Prefer `schema.safeParse()` for graceful failure; log `result.error` before returning.

---

## Critical Rules

- **All `INSERT` statements must use `WHERE NOT EXISTS`** — guarantees idempotency
  against duplicate event delivery (SQS delivers at-least-once).
- **Never remove `tls: {}` from `CacheDB`** — required for the production Redis
  instance. Only comment it out locally for dev testing.

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

## Reference Documents

For detailed context on specific topics, read the relevant file in `agent_docs/`
before beginning work.

| Document                          | When to read it                                |
| --------------------------------- | ---------------------------------------------- |
| `agent_docs/shared-utilities.md`  | Before using any module from `src/shared/`     |
| `agent_docs/database-patterns.md` | Before writing any SQL query or DB access code |
| `agent_docs/new-lambda-guide.md`  | Before creating a new lambda from scratch      |

For context specific to the lambda you are working on, read its `README.md` inside
`src/lambdas/<Lambda-Name>/README.md`.
