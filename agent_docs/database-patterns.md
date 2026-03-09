# agent_docs/database-patterns.md

Reference guide for all database access patterns in this repository.
Read this before writing any SQL query or DB access code.

---

## Connection Model

All MySQL access goes through `src/shared/databases/sequelize.ts`.

The `Database` class uses Sequelize's **replication** feature:

- **SELECT queries** (`fetchOne`, `fetchMany`) → routed to the **read-only replica** host.
- **INSERT/UPDATE queries** (`insert`, `update`) → routed to the **primary** host.

This is automatic — the lambda code does not need to manage this routing.

```typescript
// In dao.ts constructor — always pass this.environment
this.db = new Database(this.environment); // "dev" | "qa" | "prod"
```

---

## Query Methods

| Method                       | SQL type | Returns           | Use for                 |
| ---------------------------- | -------- | ----------------- | ----------------------- |
| `db.fetchOne(sql, config?)`  | SELECT   | `any \| null`     | Single-row lookups      |
| `db.fetchMany(sql, config?)` | SELECT   | `any[] \| null`   | Multi-row queries       |
| `db.insert(sql, config?)`    | INSERT   | `boolean \| null` | Writing new rows        |
| `db.update(sql, config?)`    | UPDATE   | `boolean \| null` | Modifying existing rows |

Return values:

- `fetchOne` returns `null` when no rows matched (never throws on empty result).
- `fetchMany` returns `null` when no rows matched.
- `insert`/`update` return `true` when ≥1 row was affected, `null` otherwise.

---

## Parameterized Queries

**Always use `replacements`** — never interpolate user-supplied values directly
into SQL strings (SQL injection risk).

```typescript
// Correct
const result = await this.db.fetchOne(
  `SELECT idOrder, idStatus FROM \`order\`
   WHERE idOrder = :idOrder AND idBusiness = :idBusiness`,
  { replacements: { idOrder, idBusiness } }
);

// Wrong — never do this
const result = await this.db.fetchOne(
  `SELECT * FROM \`order\` WHERE idOrder = ${idOrder}`
);
```

Sequelize `replacements` use `:paramName` syntax. Binding happens at the driver
level — the final SQL sent to MySQL has no user-supplied strings.

---

## Idempotent INSERT Pattern (Mandatory)

**Every `INSERT` in this codebase must use `WHERE NOT EXISTS`.**

SQS delivers messages **at-least-once**. Duplicate messages are normal and expected.
A `WHERE NOT EXISTS` guard ensures the same message processed twice produces
exactly one row in the database.

```typescript
// Standard idempotency pattern
await this.db.insert(
  `INSERT INTO orderShipmentUpdateHistory
     (idOrder, idShipmentUpdate, idCarrierStatusUpdate, carrierData, createdAt)
   SELECT :idOrder, :idShipmentUpdate, :idCarrierStatusUpdate, :carrierData, NOW()
   WHERE NOT EXISTS (
     SELECT 1 FROM orderShipmentUpdateHistory
     WHERE idOrder = :idOrder
       AND (
         idShipmentUpdate = :idShipmentUpdate
         OR (idCarrierStatusUpdate = :idCarrierStatusUpdate AND idShipmentUpdate IS NULL)
       )
   )`,
  {
    replacements: {
      idOrder,
      idShipmentUpdate,
      idCarrierStatusUpdate,
      carrierData
    }
  }
);
```

**Tables that require idempotent INSERTs** (non-exhaustive):

- `orderShipmentUpdateHistory`
- `orderReturnShipmentUpdateHistory`
- `orderReturn` — guard on `(idOrder, carrierTrackingCode)`
- `orderReturnStatusLog` — guard on most recent `idStatus` match
- `orderLeg` — guard on `(idOrder, carrierTrackingCode)`
- `orderReturnLeg` — guard on `(idOrderReturn, carrierTrackingCode)`

---

## Environment-Suffixed Table / Schema Names

Some lambdas prefix or suffix their schema/table names based on the environment.
The `dev` environment often uses a separate schema name:

```typescript
// Schema-level suffix pattern (reconciliation lambdas)
const schema = `db_mastershop_orders${this.environment === "dev" ? "_dev" : ""}`;
const row = await this.db.fetchOne(
  `SELECT * FROM \`${schema}\`.\`order\` WHERE idOrder = :idOrder`,
  { replacements: { idOrder } }
);
```

The shared `Database` class does NOT handle this automatically — only the connection
credentials change per environment. Schema/table naming is the lambda's responsibility
where applicable.

---

## DB Entity ID Naming

Database entity primary/foreign keys follow the `id` + camelCase convention:

```typescript
// Correct
idOrder, idUser, idBusiness, idCarrier, idStatus, idOrderReturn;

// Wrong
orderId, userId, order_id;
```

This matches the column names in the MySQL schema. Deviating will cause query
mismatches.

---

## Sequelize ORM Models (Shared)

Some lambdas (reconciliation) use Sequelize ORM model instances instead of raw SQL.
These are defined in `src/shared/databases/models/`:

| File                       | Model                              | Table                   |
| -------------------------- | ---------------------------------- | ----------------------- |
| `charge.ts`                | `ICharge` interface + model        | `charge`                |
| `chargeReconciliation.ts`  | `IChargeReconciliation` + init fn  | `chargeReconciliation`  |
| `payment.ts`               | `IPayment` interface + model       | `payment`               |
| `paymentReconciliation.ts` | `IPaymentReconciliation` + init fn | `paymentReconciliation` |

To use them, call the model's `init()` function with a Sequelize instance obtained via
`db.getInstance()`, then use Sequelize ORM methods (`upsert`, `findOne`, etc.):

```typescript
import { initChargeReconciliationModel } from "../../shared/databases/models/chargeReconciliation";

const sequelize = this.db.getInstance();
const ChargeReconciliation = initChargeReconciliationModel(sequelize);
await ChargeReconciliation.upsert({ idCharge: 123, status: "reconciled" });
```

---

## Error Handling in DAO Methods

All DAO methods must follow this pattern — catch, log, re-throw:

```typescript
fetchRecord = async (idOrder: number): Promise<any | null> => {
  try {
    return await this.db.fetchOne(
      `SELECT * FROM \`order\` WHERE idOrder = :idOrder`,
      { replacements: { idOrder } }
    );
  } catch (error) {
    console.error("Error in Dao.fetchRecord:", error);
    throw error;
  }
};
```

Never swallow errors silently. The re-throw propagates to `Model`, which re-throws
to `index.ts`, which returns a 500 response (or re-throws for SQS retry).

---

## Using Secrets Manager for DB Credentials

When the lambda uses `dbEnvSm` instead of `dbEnv`, credentials come from Secrets Manager:

```typescript
import DatabaseSM from "../../shared/databases/db-sm/sequelize-sm";
import SecretManager from "../../shared/services/secretManager";

const sm = new SecretManager("us-east-1");
const secret = await sm.getSecrets(process.env["DB_SECRET_PROD"]!);

const db = new DatabaseSM({
  database: secret.dbname,
  username: secret.username,
  password: secret.password,
  host: secret.host,
  hostReadOnly: secret.hostReadOnly
});
```

Use `dbEnvSm` in `EnvsEnum` and `checkEnv()` instead of `dbEnv` when this pattern applies.
