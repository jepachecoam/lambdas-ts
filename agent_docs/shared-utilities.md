# agent_docs/shared-utilities.md

Reference guide for every module in `src/shared/`. Read this before using any shared
utility in a lambda. Do not infer behavior from filenames alone.

---

## `src/shared/validation/envChecker.ts`

**Export:** `checkEnv<T>(EnvVariables: T): EnvRecord<T>`

Validates that every value in the passed enum/object exists in `process.env`. Throws
`Error` with a list of missing variable names if any are absent.

**Usage pattern (always the first call in the handler):**

```typescript
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import { EnvsEnum } from "./types";

// Inside the handler:
checkEnv({ ...EnvsEnum, ...dbEnv });
// If the lambda does NOT use the database, omit dbEnv:
checkEnv({ ...EnvsEnum });
```

The return value is a typed object of resolved env var strings — it is rarely used
directly because `conf/envs.ts` already holds the eagerly-loaded values.

---

## `src/shared/responses/http.ts`

**Export:** `default httpResponse({ statusCode, body })`

Returns `{ statusCode: number, body: string }` where `body` is `JSON.stringify(body)`.

```typescript
import httpResponse from "../../shared/responses/http";

return httpResponse({ statusCode: 200, body: result });
return httpResponse({ statusCode: 500, body: err });
```

---

## `src/shared/databases/sequelize.ts`

**Export:** `default class Database`

MySQL access via Sequelize. Automatically selects dev/qa/prod credentials from env vars.
Reads route to a **read-only replica**; writes route to the **primary host**.

**Constructor:** `new Database(environment: string)` — environment must be `"dev"`,
`"qa"`, or `"prod"`. Pass `this.environment` from the Dao constructor.

**Methods:**

| Method                      | Query type | Returns                                         |
| --------------------------- | ---------- | ----------------------------------------------- |
| `fetchOne(query, config?)`  | SELECT     | First row as `any`, or `null`                   |
| `fetchMany(query, config?)` | SELECT     | Array of rows as `any[]`, or `null`             |
| `insert(query, config?)`    | INSERT     | `true` if ≥1 row affected, `null` otherwise     |
| `update(query, config?)`    | UPDATE     | `true` if ≥1 row affected, `null` otherwise     |
| `getInstance()`             | —          | Raw Sequelize instance (use for ORM model init) |

**Parameterized queries** — always use `replacements` to prevent SQL injection:

```typescript
const row = await this.db.fetchOne(
  `SELECT * FROM \`order\` WHERE idOrder = :idOrder AND idBusiness = :idBusiness`,
  { replacements: { idOrder, idBusiness } }
);
```

**Dynamic table names by environment** — some lambdas suffix schema names for dev:

```typescript
const schema = `db_mastershop_orders${this.environment === "dev" ? "_dev" : ""}`;
const row = await this.db.fetchOne(
  `SELECT * FROM \`${schema}\`.\`order\` WHERE ...`
);
```

**Idempotent INSERT pattern** — mandatory for any table that may receive duplicate SQS messages:

```typescript
await this.db.insert(
  `INSERT INTO history_table (idOrder, idStatus, createdAt)
   SELECT :idOrder, :idStatus, NOW()
   WHERE NOT EXISTS (
     SELECT 1 FROM history_table
     WHERE idOrder = :idOrder AND idStatus = :idStatus
   )`,
  { replacements: { idOrder, idStatus } }
);
```

---

## `src/shared/databases/dynamo.ts`

**Export:** `default class Dynamo`

**Constructor:** `new Dynamo(region: string)` — pass the AWS region string (e.g. `"us-east-1"`).

**Methods:**

| Method                       | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `getItem(tableName, key)`    | Returns unmarshalled item or `null` |
| `putItem(tableName, item)`   | Puts item (full replace)            |
| `deleteItem(tableName, key)` | Deletes item by key                 |

**Environment-suffixed table names:** Some lambdas suffix their DynamoDB table
names based on the environment. Apply this pattern when your lambda uses separate
tables per environment:

```typescript
const tableName = environment === "dev" ? "MyTable-Dev" : "MyTable";
```

---

## `src/shared/databases/cache.ts`

**Export:** `default class CacheDB` (also named export `CacheDB`)

Redis singleton via ioredis. Use `CacheDB.getInstance(environment)` — never `new CacheDB()` directly in production (singleton pattern).

**Constructor/factory:** `CacheDB.getInstance(environment: string): CacheDB`

Keys are automatically namespaced as `{key}-{environment}` for all operations.

**Methods:**

| Method     | Signature                            | Returns                  |
| ---------- | ------------------------------------ | ------------------------ |
| `set`      | `({ key, value, expireInSeconds? })` | `"OK" \| null`           |
| `get`      | `({ key })`                          | `string \| null`         |
| `delete`   | `({ key })`                          | `number` (count deleted) |
| `exists`   | `({ key })`                          | `boolean`                |
| `expire`   | `({ key, seconds })`                 | `boolean`                |
| `flushAll` | `()`                                 | `string`                 |

**TLS warning:** `tls: {}` is enabled in the constructor. Do NOT remove it from
committed code — it is required for the production Redis instance. Only comment
it out locally for dev testing.

```typescript
import { CacheDB } from "../../shared/databases/cache";

const cache = CacheDB.getInstance(this.environment);
await cache.set({
  key: "myKey",
  value: JSON.stringify(data),
  expireInSeconds: 300
});
const cached = await cache.get({ key: "myKey" });
```

---

## `src/shared/databases/db-sm/sequelize-sm.ts`

**Export:** `default class Database` (same API as `sequelize.ts`)

Identical API to `sequelize.ts` but credentials are fetched from AWS Secrets Manager
instead of individual env vars. Use this when the lambda uses `dbEnvSm` instead of `dbEnv`.

**Constructor:** `new Database({ database, username, password, host, hostReadOnly })`

The caller is responsible for fetching the secret from Secrets Manager first and
passing the parsed fields to the constructor.

---

## `src/shared/services/httpRequest.ts`

**Export:** `b2bRequest` (named export — Axios instance)

Pre-configured Axios instance for calling the Mastershop B2B internal microservice.
Reads `B2B_BASE_URL`, `API_KEY_MS`, and `APP_NAME_MS` from `process.env` at module load time.

**When to use:** When making calls to an internal microservice from a Dao and
HTTP errors should propagate as thrown exceptions.

**When to create a local wrapper instead:** If HTTP failures for individual
records must be non-fatal (i.e. the lambda should continue processing other
records when one HTTP call fails), create a local Axios wrapper in `utils.ts`
that catches errors and returns `null` instead of throwing.

```typescript
import { b2bRequest } from "../../shared/services/httpRequest";

const response = await b2bRequest.get(`/api/b2b/logistics/order/${idUser}`);
```

---

## `src/shared/services/concurrency.ts`

**Export:** `default { executeWithLimit }`

Runs an array of async tasks with a concurrency cap using `p-limit` + `Promise.allSettled`.
One task failure does not abort the others.

**Signature:**

```typescript
executeWithLimit({
  tasks: (() => Promise<any>)[],
  concurrencyLimit: number
}): Promise<{ successfulOperations: any[], haveErrors: boolean }>
```

```typescript
import concurrency from "../../shared/services/concurrency";

const { successfulOperations, haveErrors } = await concurrency.executeWithLimit(
  {
    tasks: records.map((record) => () => this.processOne(record)),
    concurrencyLimit: 5
  }
);

if (haveErrors) {
  console.warn("Some records failed during processing");
}
```

---

## `src/shared/services/secretManager.ts`

**Export:** `default class SecretManager`

**Constructor:** `new SecretManager(region: string)`

**Method:** `getSecrets(secretName: string): Promise<any>` — returns parsed JSON of
the secret value. Throws `Error("Secrets has been not retrieved")` on failure.

```typescript
import SecretManager from "../../shared/services/secretManager";

const sm = new SecretManager("us-east-1");
const credentials = await sm.getSecrets("my-secret-name");
// credentials is the parsed JSON object from Secrets Manager
```

---

## `src/shared/types/database.ts`

**Exports:** `EnvironmentTypes`, `dbEnv`, `dbEnvSm`

- `EnvironmentTypes` = `"dev" | "prod" | "qa"` — use as the type for `environment` params.
- `dbEnv` — enum of 15 env var keys (5 vars × 3 envs) for MySQL with direct credentials.
- `dbEnvSm` — enum of 4 env var keys for MySQL with Secrets Manager credentials.

Always spread `dbEnv` into `checkEnv()` when using the shared Database class:

```typescript
import { dbEnv } from "../../shared/types/database";
checkEnv({ ...EnvsEnum, ...dbEnv });
```
