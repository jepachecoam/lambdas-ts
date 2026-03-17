# agent_docs/error-handling.md

Error handling patterns, logging conventions, and critical runtime rules.
Read this before writing any try/catch block, handling SQS events, or adding logging.

---

## Handler-Level Error Handling

The handler always has a single top-level `try/catch`. On error, return a 500 response.

```typescript
export const handler = async (event: any, _context: any) => {
  try {
    // ...
  } catch (err) {
    console.error("Error in handler", err);
    return httpResponse({ statusCode: 500, body: err });
  }
};
```

**Exception — SQS-triggered lambdas:** must `throw err` instead of returning a 500.
Returning a response from an SQS handler silently discards the message. Throwing
causes Lambda to treat the invocation as failed, returning the message to the queue
for retry.

```typescript
// SQS handler pattern
} catch (err) {
  console.error("Error in handler", err);
  throw err; // NOT httpResponse — message must go back to queue
}
```

Always check the lambda's `README.md` to confirm its trigger type before choosing
which pattern to use.

---

## Model and DAO Error Handling

All methods in `Model` and `Dao` must follow this pattern: catch, log, re-throw.
Never swallow errors silently.

```typescript
fetchData = async (params: IParams) => {
  try {
    return await this.dao.query(params);
  } catch (error) {
    console.error("Error in Model.fetchData:", error);
    throw error;
  }
};
```

The re-throw propagates to `Model` → `index.ts` → returns 500 (or re-throws for SQS retry).

Rules:

- Only throw `Error` objects — never throw string literals or plain objects.
- Use strict equality (`===`); `== null` is acceptable for null/undefined checks.

---

## Batch / Parallel Operations

Use `Promise.allSettled` for any operation processing multiple records in parallel.
One record failing must never abort the rest of the batch.

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

Do NOT use `Promise.all` for batch operations — a single rejection aborts everything.

---

## Logging Conventions

Four patterns, each with a specific purpose:

```typescript
console.log("Event :>>>", JSON.stringify(event)); // Always first line in handler
console.log("Result =>>>", result); // Inspect data at key points
console.error("Error processing record", error); // Caught errors — always include the error object
console.warn("Missing optional field, skipping"); // Non-fatal warnings
```

Rules:

- Always log the raw event at handler entry with `"Event :>>>"` prefix.
- Always pass the error object as the second argument to `console.error`.
- Do not use `console.debug` or `console.info` — not consistent with the codebase.

---

## Critical Runtime Rules

### INSERT Idempotency — Mandatory

**All `INSERT` statements must use `WHERE NOT EXISTS`.**

SQS delivers messages at-least-once. The same event can arrive twice. A
`WHERE NOT EXISTS` guard ensures processing the same message twice produces
exactly one row.

```typescript
await this.db.insert(
  `INSERT INTO orderHistory (idOrder, idStatus, createdAt)
   SELECT :idOrder, :idStatus, NOW()
   WHERE NOT EXISTS (
     SELECT 1 FROM orderHistory
     WHERE idOrder = :idOrder AND idStatus = :idStatus
   )`,
  { replacements: { idOrder, idStatus } }
);
```

This is not optional. See `agent_docs/database-patterns.md` for full examples.

### Redis TLS — Never Remove

**Never remove `tls: {}` from `CacheDB`.**

The `tls: {}` option is required for the production Redis instance. Only comment it
out locally for dev testing. It must always be present in committed code.
