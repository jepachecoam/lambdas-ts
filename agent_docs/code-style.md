# agent_docs/code-style.md

TypeScript configuration, formatting rules, naming conventions, and class patterns.
Read this before writing any new code or performing a refactor.

---

## TypeScript Configuration

- **Target**: `es2016`, **Module**: `commonjs`
- **Strict mode**: `strict: true`, `noImplicitAny: true`
- `noUnusedLocals` and `noUnusedParameters` are both `false`
- `noPropertyAccessFromIndexSignature: true` — use bracket notation for index signatures
- `esModuleInterop: true`
- No path aliases — use relative imports everywhere

---

## Formatting (Prettier)

```json
{
  "semi": true,
  "arrowParens": "always",
  "singleQuote": false,
  "trailingComma": "none"
}
```

Rules:

- **Double quotes** for all strings and imports — never single quotes
- **Semicolons** always required
- **No trailing commas** — not even in multi-line arrays/objects
- Arrow functions always have parentheses: `(x) => x`
- Spaces only — no tabs
- Opening brace on same line (`1tbs`)
- Spaces inside object braces: `{ key: value }`

---

## Import Order

Imports are sorted automatically by `eslint-plugin-simple-import-sort` (enforced as error).
Running `eslint --fix` will correct the order automatically.

Rules:

- Third-party packages before local imports
- Alphabetical within each group
- No `.ts` extension in import paths
- No duplicate imports from the same module
- One `const`/`let` declaration per statement

```typescript
// Correct order
import axios from "axios";
import { z } from "zod";

import Database from "../../shared/databases/sequelize";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import { EnvsEnum } from "./types";
```

---

## Naming Conventions

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

---

## Classes and Methods

Methods in `Model` and `Dao` are defined as **arrow function class properties**, not
prototype methods. This is the standard for new code in this repo.

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

---

## Environment Variables Pattern

1. Define all required env var keys in an `EnvsEnum` inside `types.ts`.
2. Load them eagerly in `conf/envs.ts` using `process.env[EnvsEnum.KEY]!`.
3. Call `checkEnv({ ...EnvsEnum, ...dbEnv })` at the top of the handler to fail fast.
   Omit `dbEnv` if the lambda does not use the database.

```typescript
// types.ts
export enum EnvsEnum {
  ENVIRONMENT = "ENVIRONMENT",
  BASE_URL_SOMETHING = "BASE_URL_SOMETHING"
}

// conf/envs.ts
import { EnvsEnum } from "../types";
export const envs = {
  ENVIRONMENT: process.env[EnvsEnum.ENVIRONMENT]!,
  BASE_URL_SOMETHING: process.env[EnvsEnum.BASE_URL_SOMETHING]!
};
```

---

## Input Validation (Zod)

- Use **Zod** for input/payload schema validation. Co-locate schemas in `types.ts`.
- Prefer `schema.safeParse()` for graceful failure; log `result.error` before throwing.
- Derive the TypeScript type from the Zod schema to avoid duplication.

```typescript
// types.ts
import { z } from "zod";

export const inputSchema = z.object({
  idOrder: z.number(),
  idBusiness: z.number()
});
export type IInput = z.infer<typeof inputSchema>;

// dto.ts
import { inputSchema } from "./types";

const extractParams = (event: any) => {
  const result = inputSchema.safeParse(event.body ?? event);
  if (!result.success) {
    console.error("Invalid input", result.error);
    throw new Error("Invalid input");
  }
  return result.data;
};
```

---

## Key Dependencies Reference

| Package                                      | Purpose                                |
| -------------------------------------------- | -------------------------------------- |
| `@aws-sdk/client-dynamodb`                   | DynamoDB access                        |
| `@aws-sdk/client-s3`                         | S3 access                              |
| `@aws-sdk/client-sqs`                        | SQS access                             |
| `@aws-sdk/client-sfn`                        | Step Functions                         |
| `@aws-sdk/client-secrets-manager`            | Secrets Manager                        |
| `@aws-sdk/client-bedrock-runtime`            | Bedrock (AI)                           |
| `sequelize` + `mysql2`                       | MySQL ORM and driver                   |
| `ioredis`                                    | Redis client                           |
| `zod`                                        | Schema validation                      |
| `ajv`                                        | JSON Schema validation (alternative)   |
| `axios`                                      | HTTP client                            |
| `aws-jwt-verify`, `jsonwebtoken`, `jwks-rsa` | JWT auth                               |
| `@vercel/ncc`                                | Bundles each lambda to `dist/index.js` |
