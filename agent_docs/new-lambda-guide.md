# agent_docs/new-lambda-guide.md

Step-by-step checklist for creating a new lambda from scratch.
Read this entire document before writing any code.

---

## Prerequisites

Before creating a new lambda:

1. Read `AGENTS.md` — conventions, naming, code style, error handling.
2. Read `ARCHITECTURE.md` — the 5-layer pattern, data flow, and architectural invariants.
3. Read `agent_docs/shared-utilities.md` — identify which shared modules you need.
4. Read `agent_docs/database-patterns.md` — if the lambda accesses MySQL.

---

## Step 1 — Create the Lambda Folder

Lambda folder names follow `PascalCase-with-hyphens` convention:

```
src/lambdas/<Domain>-<Purpose>/
```

Examples: `Mastershop-UpdateOrders`, `MasterShop-ProductApproval-BasicValidations`

```bash
mkdir src/lambdas/MyDomain-MyPurpose
mkdir src/lambdas/MyDomain-MyPurpose/conf
```

---

## Step 2 — Copy the `example` Lambda as a Starting Point

The `src/lambdas/example/` directory contains a canonical 5-layer scaffold.
Copy all its files and use them as the base — do not write from scratch.

```bash
cp src/lambdas/example/index.ts    src/lambdas/MyDomain-MyPurpose/index.ts
cp src/lambdas/example/model.ts    src/lambdas/MyDomain-MyPurpose/model.ts
cp src/lambdas/example/dao.ts      src/lambdas/MyDomain-MyPurpose/dao.ts
cp src/lambdas/example/dto.ts      src/lambdas/MyDomain-MyPurpose/dto.ts
cp src/lambdas/example/types.ts    src/lambdas/MyDomain-MyPurpose/types.ts
cp src/lambdas/example/conf/envs.ts src/lambdas/MyDomain-MyPurpose/conf/envs.ts
```

---

## Step 3 — Define Types (`types.ts`)

Fill in `types.ts` first — all other files depend on it.

Checklist:

- [ ] Add `EnvsEnum` with every lambda-specific env var key (NOT DB vars — those come from `dbEnv`).
- [ ] Add a Zod schema for the expected input payload (co-locate with `types.ts`).
- [ ] Derive the TypeScript type from the Zod schema: `export type IInput = z.infer<typeof inputSchema>`.
- [ ] Add interfaces for shapes returned by the DAO (e.g. `IOrderRow`, `IProcessResult`).
- [ ] Add domain enums if needed (carrier names, status codes, sources).
- [ ] **No executable code** — only type/interface/enum/const declarations.

```typescript
// types.ts skeleton
import { z } from "zod";

export enum EnvsEnum {
  ENVIRONMENT = "ENVIRONMENT"
  // Add lambda-specific vars:
  // BASE_URL_SOMETHING = "BASE_URL_SOMETHING",
}

export const inputSchema = z.object({
  /* ... */
});
export type IInput = z.infer<typeof inputSchema>;

export interface IResultRow {
  /* ... */
}
```

---

## Step 4 — Load Env Vars (`conf/envs.ts`)

Mirror every key in `EnvsEnum` with `process.env[EnvsEnum.KEY]!`:

```typescript
import { EnvsEnum } from "../types";

export const envs = {
  ENVIRONMENT: process.env[EnvsEnum.ENVIRONMENT]!
  // BASE_URL_SOMETHING: process.env[EnvsEnum.BASE_URL_SOMETHING]!,
};
```

---

## Step 5 — Implement the DAO (`dao.ts`)

Checklist:

- [ ] Constructor takes `environment: string` and instantiates `new Database(environment)`.
- [ ] All methods are **arrow function class properties** (not prototype methods).
- [ ] Every method has a `try/catch` that `console.error`s and re-throws.
- [ ] Every INSERT uses `WHERE NOT EXISTS` for idempotency.
- [ ] No business logic — fetch and return data only.
- [ ] Remove unused imports from the scaffold.

```typescript
class Dao {
  private environment: string;
  private db: Database;

  constructor(environment: string) {
    this.environment = environment;
    this.db = new Database(environment);
  }

  fetchSomething = async (idOrder: number): Promise<IResultRow | null> => {
    try {
      return await this.db.fetchOne(`SELECT ...`, {
        replacements: { idOrder }
      });
    } catch (error) {
      console.error("Error in Dao.fetchSomething:", error);
      throw error;
    }
  };
}
```

---

## Step 6 — Implement the DTO (`dto.ts`)

Checklist:

- [ ] Export as a plain default object: `export default { extractParams, ... }`.
- [ ] `extractParams(event)` validates the event using `inputSchema.safeParse()`.
- [ ] Throws on invalid input so the handler catch returns a 500.
- [ ] No DB calls, no business logic.

---

## Step 7 — Implement the Model (`model.ts`)

Checklist:

- [ ] Constructor takes `environment: string`, stores it, instantiates `new Dao(environment)`.
- [ ] All methods are **arrow function class properties**.
- [ ] No direct DB access — all data access via `this.dao.*`.
- [ ] Every method has a `try/catch` that `console.error`s and re-throws.
- [ ] Use `Promise.allSettled` for any batch/parallel operations.
- [ ] Name the main entry-point method descriptively (not just `process`).

---

## Step 8 — Implement the Handler (`index.ts`)

Checklist:

- [ ] Canonical order: `console.log event` → `checkEnv()` → `new Model()` → `dto.extractParams()` → `model.method()` → `return httpResponse(200)`.
- [ ] Single `try/catch` — `return httpResponse(500)` on error (never throw out of handler).
  - **Exception:** SQS-triggered lambdas must `throw err` so Lambda retries the message.
- [ ] `checkEnv({ ...EnvsEnum, ...dbEnv })` — omit `dbEnv` if no DB is used.
- [ ] Imports must be sorted (eslint-plugin-simple-import-sort enforces this on commit).

---

## Step 9 — Register the Lambda in the Dev Server

Add a route to `src/conf/routes.ts` so the lambda can be called locally via `npm run dev`:

```typescript
// In routes.ts — follow the existing pattern
import { handler as myLambdaHandler } from "../lambdas/MyDomain-MyPurpose";

router.post("/my-domain-my-purpose", serverResponse(myLambdaHandler, "http"));
```

Response type is `"http"` for HTTP-triggered lambdas and `"void"` for SQS/event-triggered ones.

---

## Step 10 — Add Environment Variables

Add required env vars to `.example.env` so other developers know what to set:

```bash
# MyDomain-MyPurpose lambda
BASE_URL_SOMETHING=
ENVIRONMENT=dev
```

---

## Step 11 — Lint and Format

Before committing, run lint and format on all new files:

```bash
npx eslint --fix src/lambdas/MyDomain-MyPurpose/index.ts
npx eslint --fix src/lambdas/MyDomain-MyPurpose/model.ts
npx eslint --fix src/lambdas/MyDomain-MyPurpose/dao.ts
npx eslint --fix src/lambdas/MyDomain-MyPurpose/dto.ts
npx eslint --fix src/lambdas/MyDomain-MyPurpose/types.ts
npx prettier --write src/lambdas/MyDomain-MyPurpose/
```

The pre-commit hook will also run these automatically, but fixing them before
committing gives cleaner diffs.

---

## File Creation Checklist Summary

| File           | Required    | Notes                              |
| -------------- | ----------- | ---------------------------------- |
| `types.ts`     | Yes         | EnvsEnum + Zod schema + interfaces |
| `conf/envs.ts` | Yes         | Eagerly-loaded env var constants   |
| `dto.ts`       | Yes         | Parse/validate input               |
| `dao.ts`       | Yes         | All data access                    |
| `model.ts`     | Yes         | Business logic                     |
| `index.ts`     | Yes         | Handler entry point only           |
| `utils.ts`     | Optional    | Lambda-specific helpers            |
| `README.md`    | Recommended | Document trigger, env vars, flow   |

---

## Common Mistakes to Avoid

| Mistake                           | Correct approach                                                |
| --------------------------------- | --------------------------------------------------------------- |
| Business logic in `index.ts`      | Move to `model.ts`                                              |
| DB queries in `model.ts`          | Move to `dao.ts`                                                |
| `throw` in handler catch          | Return `httpResponse({ statusCode: 500 })` (except SQS lambdas) |
| INSERT without `WHERE NOT EXISTS` | Always add idempotency guard                                    |
| Prototype methods in Model/Dao    | Use arrow function class properties                             |
| Single quotes in strings          | Use double quotes everywhere                                    |
| Trailing commas in arrays/objects | Remove them (Prettier config: `"trailingComma": "none"`)        |
| `.ts` extension in import paths   | Omit the extension                                              |
| Unsorted imports                  | Run `eslint --fix` — import-sort is enforced as error           |
