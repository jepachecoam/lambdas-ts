# Mastershop-UpdateOrders

## Overview

AWS Lambda that processes carrier shipment tracking events delivered via Amazon SQS. For each event, the lambda:

1. Looks up which order entity (order, order leg, order return, or return leg) the carrier tracking number belongs to.
2. Translates carrier-specific status codes into internal platform statuses using a configurable mapping table.
3. Writes status updates across the relevant database tables and the Mastershop microservice HTTP API.
4. Handles linked shipments (new leg creation), return process initiation, and additional downstream event dispatching.
5. Retries records not yet found in the database up to **3 times** with a **30-second delay** between attempts before sending an error notification.

---

## Architecture

The lambda follows the strict 5-layer pattern used across the repository:

| File           | Layer               | Responsibility                                                                                                                    |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`     | Handler             | Entry point. Validates env vars, parses the SQS event, delegates to `Model`. No business logic.                                   |
| `model.ts`     | Business Logic      | Orchestrates the full processing pipeline: retry loop, status translation, order/return routing, and side effects.                |
| `dao.ts`       | Data Access         | All MySQL queries (via Sequelize) and HTTP calls to the Mastershop microservice and error webhook.                                |
| `dto.ts`       | Data Transformation | Schema validation, carrier-name-to-ID mapping, source-precedence filtering, status translation engine, shipping rate calculation. |
| `types.ts`     | Type Definitions    | Interfaces, enums (`EnvsEnum`, `Carriers`, `OrderSources`, `OrderLegSource`), and Zod schemas (`recordSchema`).                   |
| `utils.ts`     | Utilities           | Zod record validation, JSON sanitization, HTTP Axios wrapper, delay helper, response formatter.                                   |
| `conf/envs.ts` | Env Config          | Eagerly-loaded lambda-specific environment variable constants.                                                                    |

---

## Trigger & Input Event

**Trigger:** Amazon SQS (batch invocation)

Each record in `event.Records` carries a `body` string that is a JSON-serialized message conforming to `recordSchema`.

### Event structure

```json
{
  "Records": [
    {
      "body": "{\"carrierName\":\"COORDINADORA\",\"trackingNumber\":\"123456789\",\"status\":{\"statusCode\":\"099\",\"statusName\":\"Entregado\"},\"novelty\":{\"noveltyCode\":null},\"returnProcess\":{\"returnTrackingNumber\":null},\"linkedShipment\":{\"linkedCarrierTrackingCode\":null,\"shippingRate\":null,\"originAddress\":null,\"shippingAddress\":null,\"legReason\":null},\"carrierData\":{},\"updateSource\":null}"
    }
  ]
}
```

### Message body fields

| Field                                      | Type                            | Required | Description                                                                                                           |
| ------------------------------------------ | ------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `carrierName`                              | `string`                        | Yes      | Carrier identifier. Must match a supported carrier name (see [Supported Carriers](#supported-carriers)).              |
| `trackingNumber`                           | `string` `/^[0-9]+$/`           | Yes      | Carrier-issued tracking number (digits only).                                                                         |
| `status.statusCode`                        | `string` `/^[0-9]+$/`           | Yes      | Carrier-specific status code to be translated into an internal status.                                                |
| `status.statusName`                        | `string \| null`                | Yes      | Human-readable status label provided by the carrier.                                                                  |
| `novelty.noveltyCode`                      | `string` `/^[0-9]+$/` \| `null` | Yes      | Novelty sub-code used when the status maps to a `CON-NOVEDAD` rule (see [Novelty Codes](#novelty-codes-con-novedad)). |
| `returnProcess.returnTrackingNumber`       | `string` `/^[0-9]+$/` \| `null` | Yes      | Tracking number for the return shipment, used when the status triggers return creation.                               |
| `linkedShipment.linkedCarrierTrackingCode` | `string \| null`                | No       | Tracking code for the next shipment leg when the status is tagged `LINKED-SHIPMENT`.                                  |
| `linkedShipment.shippingRate`              | `number \| null`                | No       | Shipping rate for the new leg.                                                                                        |
| `linkedShipment.originAddress`             | `object \| null`                | No       | Origin address for the new leg.                                                                                       |
| `linkedShipment.shippingAddress`           | `object \| null`                | No       | Destination address for the new leg.                                                                                  |
| `linkedShipment.legReason`                 | `string \| null`                | No       | Reason for the new leg creation.                                                                                      |
| `carrierData`                              | `any`                           | Yes      | Raw payload from the carrier. Stored as sanitized JSON in the history tables.                                         |
| `updateSource`                             | `string \| null`                | No       | Optional identifier for the originating system that sent this event.                                                  |
| `forcedExecution`                          | `boolean`                       | No       | If `true`, processes records even when the matched carrier status rule is marked `isActive=false`.                    |

---

## Environment Variables

### Lambda-specific

| Variable                 | Description                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `BASE_URL_MS`            | Base URL for the Mastershop internal microservice (e.g. `https://api.internal.example.com`).             |
| `API_KEY_MS`             | API key sent as the `x-api-key` header on all Mastershop microservice requests.                          |
| `APP_NAME_MS`            | Application name sent as the `x-app-name` header on all Mastershop microservice requests.                |
| `URL_WEBHOOK_ERROR_LOGS` | HTTP endpoint that receives structured error notifications for invalid, unresolvable, or failed records. |
| `ENVIRONMENT`            | Runtime environment. Accepted values: `"dev"`, `"qa"`, `"prod"`.                                         |

### Database

One set of variables per environment suffix (`DEV`, `QA`, `PROD`):

| Variable                  | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `DB_NAME_{ENV}`           | Database (schema) name.                                |
| `DB_USER_{ENV}`           | Database username.                                     |
| `DB_PASSWORD_{ENV}`       | Database password.                                     |
| `DB_HOST_{ENV}`           | Primary (read-write) database host.                    |
| `DB_HOST_READ_ONLY_{ENV}` | Read-only replica host. Used for all `SELECT` queries. |

---

## Processing Flow

```
SQS Event (batch of tracking update messages)
  │
  ▼
[index.ts]
  checkEnv()                          ← fail-fast: aborts if any env var is missing
  dto.parseEventParams()              ← parse Records[], extract logStreamId from context
  model.processRecordsWithRetries()   ← up to 3 attempts, 30s delay between each
  │
  ▼
[model] fetchValidRecordsForProcessing(records)
  ├── dto.parseRecords()
  │     ├── Zod schema validation per record
  │     ├── Map carrierName → idCarrier (integer)
  │     └── Split into: validRecords / invalidRecords
  │
  ├── processInvalidRecords()         ← sendErrorNotification per invalid record (webhook)
  │
  ├── dao.getDataByCarrierTrackingNumber()
  │     └── CTE UNION ALL across order, orderLeg, orderReturn, orderReturnLeg
  │         (4-level source precedence by tracking number)
  │
  ├── dao.getOrderPrecedence()
  │     └── CTE UNION ALL across the same 4 tables
  │         (4-level source precedence by idOrder)
  │
  ├── dto.filterRecordsBySource()     ← keep only (idOrder, source) pairs that match precedence result
  │
  └── dto.mergeEventWithOrderData()
        ├── recordsWithData           → sent to processValidRecords()
        └── recordsWithoutData        → retried (up to 3x, 30s wait each)
                                         → handleUnprocessedRecords() after exhaustion
                                            └── sendErrorNotification per record (webhook)
  │
  ▼
[model] processValidRecords(records)   ← Promise.allSettled (record-level isolation)
  │
  ├── dao.getCarrierStatus()          ← fetch carrierStatusUpdate JOIN status for the carrier
  ├── dao.getShipmentUpdates()        ← fetch shipmentUpdate rows for the carrier
  ├── dto.searchNewStatus()           ← translate statusCode → { idStatus, idShipmentUpdate,
  │                                      idCarrierStatusUpdate, isLinkedShipmentCode,
  │                                      haveInactiveRule, requiresAdditionalSteps }
  │
  ├── [notFoundCode set]    → sendErrorNotification (webhook), skip record
  ├── [haveInactiveRule &&
  │    !forcedExecution]   → skip record
  │
  └── processOrderBasedOnSource()
        │
        ├── source = "order" | "orderLeg"
        │     └── handleOrder()
        │           ├── validateOrderLeg()  [only if source = "orderLeg"]
        │           │     └── Fetch latest orderLeg; skip if carrierTrackingCode mismatch
        │           ├── validateAndSanitizeJSON(carrierData)
        │           ├── dao.createOrderShipmentUpdateHistoryIfNotExists()  ← idempotent INSERT
        │           │     └── Skip rest of record if row already existed
        │           ├── updateOrder()
        │           │     ├── dao.getOrder()   ← POST Mastershop API
        │           │     └── dao.putOrder()   ← PUT Mastershop API
        │           │           [special: if idStatus=8 and current status ≠ 6 or 8,
        │           │            first PUT to idStatus=6, then PUT to idStatus=8]
        │           ├── [returnCode]        → createOrderReturn()
        │           │     ├── dao.getOrderData()
        │           │     ├── dto.getShippingRate()   ← carrier-specific calculation
        │           │     └── dao.createOrderReturnIfNotExists()  ← idempotent INSERT
        │           ├── [isLinkedShipmentCode] → dao.createOrderLeg()  ← idempotent INSERT
        │           └── [requiresAdditionalSteps] → sendEventToProcessAdditionalSteps()
        │                 └── dao.sendEvent()  ← POST Mastershop API /processevents
        │
        └── source = "orderReturn" | "orderReturnLeg"
              └── handleOrderReturn()
                    ├── validateOrderReturnLeg()  [only if source = "orderReturnLeg"]
                    │     └── Fetch latest orderReturnLeg; skip if carrierTrackingCode mismatch
                    ├── validateAndSanitizeJSON(carrierData)
                    ├── dao.createOrderReturnShipmentUpdateHistoryIfNotExists()  ← idempotent INSERT
                    │     └── Skip rest of record if row already existed
                    ├── updateOrderReturn()
                    │     ├── dao.createOrderReturnStatusLogIfNotExists()  ← idempotent INSERT
                    │     │     └── Skip if last status for this orderReturn is already idStatus
                    │     └── dao.updateStatusOrderReturn()  ← UPDATE orderReturn
                    ├── [isLinkedShipmentCode] → dao.createOrderReturnLeg()  ← idempotent INSERT
                    └── [requiresAdditionalSteps] → sendEventToProcessAdditionalSteps()
                          └── dao.sendEvent()  ← POST Mastershop API /processevents
```

---

## Supported Carriers

| Carrier Name      | Internal `idCarrier` |
| ----------------- | -------------------- |
| `TCC`             | `4`                  |
| `DOMINA`          | `5`                  |
| `COORDINADORA`    | `6`                  |
| `ENVIA`           | `7`                  |
| `SWAYP`           | `8`                  |
| `INTERRAPIDISIMO` | `9`                  |
| `IN-HOUSE`        | `11`                 |
| `SWAYP-PERU`      | `12`                 |

---

## Source Precedence

A single tracking number can be associated with multiple entity types simultaneously (e.g. an order and one of its legs). The lambda uses a **4-level precedence rule** to determine which entity type takes ownership of a given tracking number or order ID:

```
orderReturnLeg  >  orderReturn  >  orderLeg  >  order
  (highest)                                    (lowest)
```

This rule is applied **twice** via CTE-based SQL queries:

1. **By tracking number** (`getDataByCarrierTrackingNumber`): Each CTE level excludes tracking codes already claimed by a higher-precedence level. Returns one row per tracking number.
2. **By order ID** (`getOrderPrecedence`): Same structure but keyed on `idOrder`. Used to verify that the entity type resolved in step 1 matches the canonical type for that order.

Records that exist in the DB but resolve to a different entity type than the precedence query dictates are silently discarded (not retried, not errored).

---

## Key Business Rules

### Leg validation

When `source = "orderLeg"` or `"orderReturnLeg"`, the lambda fetches the **most recent leg** row (ordered by `createdAt DESC, idOrderLeg DESC`) for the associated order or return. The record is silently **skipped** if:

- No leg row exists, or
- The leg's `carrierTrackingCode` does not exactly match the event's `trackingNumber`.

This ensures that only the active/current leg processes status updates, and stale leg tracking codes are ignored.

### Status 8 intermediate transition

Transitioning an order to `idStatus = 8` requires passing through `idStatus = 6` ("En Tránsito") first. If the order's current status is neither `6` nor `8`, the lambda issues **two consecutive `PUT /order` calls**:

1. `PUT /order` with `idStatus = 6`
2. `PUT /order` with `idStatus = 8`

This enforces a clean status history trail in the Mastershop platform.

### Return code detection (`idStatus = 10`)

Carrier status codes mapped to internal `idStatus = 10` trigger automatic creation of an `orderReturn` record via `dao.createOrderReturnIfNotExists`. The return tracking number is taken from `returnProcess.returnTrackingNumber` if present; otherwise, the original `trackingNumber` is reused.

### Linked shipments (`LINKED-SHIPMENT`)

A carrier status code tagged with `statusAuxLabel = "LINKED-SHIPMENT"` in the `carrierStatusUpdate` table indicates that the carrier has handed the shipment to a secondary carrier for the next leg. When detected:

- For `order`/`orderLeg` sources → `dao.createOrderLeg()` is called.
- For `orderReturn`/`orderReturnLeg` sources → `dao.createOrderReturnLeg()` is called.

The new leg record is populated from the `linkedShipment` fields of the incoming message.

### Novelty codes (`CON-NOVEDAD`)

A carrier status code tagged with `statusAuxLabel = "CON-NOVEDAD"` indicates a shipment exception or incident. When detected:

- The internal status is overridden to `idStatus = 6` ("En Tránsito"), regardless of the original carrier code mapping.
- An `idShipmentUpdate` is resolved by looking up `noveltyCode` in the `shipmentUpdate` table.
- If no matching novelty code is found, `idShipmentUpdate = 505` is used as the default fallback.

### Inactive rules

If the matched carrier status rule has `isActive = false`, the record is **skipped entirely** unless the incoming message includes `forcedExecution = true`. This allows carrier status mappings to be temporarily deactivated without removing them from the database.

### Additional processing steps

When the matched carrier status or shipment update entry has `requiresAdditionalSteps = true`, the lambda publishes a structured event to the Mastershop `processevents` endpoint after completing the standard update. The event payload includes:

```json
{
  "source": "MASTERSHOP-PROCESS-ADDITIONAL-STEPS-IN-ORDERS-UPDATES",
  "detailType": "<CARRIER_NAME_UPPERCASED>",
  "detail": { "<full merged record data>", "contextStage": "<environment>" }
}
```

### Shipping rate calculation for order returns

The shipping rate stored on the new `orderReturn` record is computed by `dto.getShippingRate` using carrier-specific logic:

| Carrier                                                | Payment method | Calculation                                                                                                |
| ------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `COORDINADORA`                                         | `COD`          | If `carrierInfo.extraData.insuredValueReturn` is present → `0`; otherwise → `shippingRate - collectionFee` |
| `COORDINADORA`                                         | Non-COD        | `shippingRate` (full value)                                                                                |
| `TCC`, `SWAYP`, `ENVIA`, `INTERRAPIDISIMO`, `IN-HOUSE` | Any            | `0`                                                                                                        |

---

## External Services

### Mastershop microservice

Base URL: `{BASE_URL_MS}/{ENVIRONMENT}`

| Method | Path                                | Purpose                                                                        |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| `POST` | `/api/b2b/logistics/order/{idUser}` | Fetch the current state of an order before updating it.                        |
| `PUT`  | `/api/b2b/logistics/order`          | Apply a new status to an order.                                                |
| `POST` | `/api/b2b/logistics/processevents`  | Publish an event for downstream processors when additional steps are required. |

All requests include the headers:

```
x-api-key:  {API_KEY_MS}
x-app-name: {APP_NAME_MS}
```

### Error webhook

| Method | URL                        | Purpose                                                                                     |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------- |
| `POST` | `{URL_WEBHOOK_ERROR_LOGS}` | Sends a structured JSON payload for any invalid, unresolvable, or processing-failed record. |

Error payload shape:

```json
{
  "carrierName": "COORDINADORA",
  "trackingNumber": "123456789",
  "logStreamId": "2024/01/01/[$LATEST]abc123",
  "error": "No data found after retries",
  "notes": "<additional context>"
}
```

---

## Database

### Tables read (via read-only replica)

| Table                 | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `order`               | Look up order by tracking number; fetch full order row for return creation.    |
| `orderLeg`            | Look up order leg by tracking number; fetch latest leg for validation.         |
| `orderReturn`         | Look up order return by tracking number.                                       |
| `orderReturnLeg`      | Look up return leg by tracking number; fetch latest return leg for validation. |
| `carrierStatusUpdate` | Carrier-to-internal status code mapping table (joined with `status`).          |
| `status`              | Internal status definitions (id, name).                                        |
| `shipmentUpdate`      | Shipment update/novelty code definitions.                                      |

### Tables written (via primary host)

| Table                              | Operation | Idempotency guard                                                                                                                                                    |
| ---------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orderShipmentUpdateHistory`       | `INSERT`  | `WHERE NOT EXISTS` — skips if the last history row for the order has the same `idShipmentUpdate` or the same `idCarrierStatusUpdate` with a null `idShipmentUpdate`. |
| `orderReturnShipmentUpdateHistory` | `INSERT`  | Same logic as above for order returns.                                                                                                                               |
| `orderReturn`                      | `INSERT`  | `WHERE NOT EXISTS` on `(idOrder, carrierTrackingCode)`.                                                                                                              |
| `orderReturnStatusLog`             | `INSERT`  | `WHERE NOT EXISTS` — skips if the most recent log entry for the return already has the same `idStatus`.                                                              |
| `orderLeg`                         | `INSERT`  | `WHERE NOT EXISTS` on `(idOrder, carrierTrackingCode)`.                                                                                                              |
| `orderReturnLeg`                   | `INSERT`  | `WHERE NOT EXISTS` on `(idOrderReturn, carrierTrackingCode)`.                                                                                                        |
| `orderReturn`                      | `UPDATE`  | Plain `UPDATE` by `idOrderReturn`. Applied after the status log insert.                                                                                              |

---

## Error Handling & Idempotency

### Retry mechanism

Records whose tracking number is not found in the database are not immediately discarded. The lambda retries them with a 30-second delay between attempts to allow time for database propagation:

```
Attempt 1 → not found → wait 30s
Attempt 2 → not found → wait 30s
Attempt 3 → not found → sendErrorNotification (webhook)
```

### Record-level isolation

`processValidRecords` wraps all per-record work in `Promise.allSettled`. A failure on one record does not abort processing of any other record in the same batch. Each error is caught, logged via `console.error`, and sent to the error webhook.

### Error notification triggers

| Condition                                              | Action                                           |
| ------------------------------------------------------ | ------------------------------------------------ |
| Record fails Zod schema validation                     | Immediate `sendErrorNotification`, no retry.     |
| Tracking number not found after all retries            | `sendErrorNotification` after final attempt.     |
| Carrier status code not found in `carrierStatusUpdate` | `sendErrorNotification`, record skipped.         |
| Per-record processing error (any unhandled exception)  | `sendErrorNotification`, other records continue. |

### Write idempotency

All `INSERT` operations use `WHERE NOT EXISTS` subqueries. Duplicate SQS message deliveries (standard SQS at-least-once guarantee) are safe and will not produce duplicate rows.

### JSON sanitization

Before storing `carrierData` in any history table, `utils.validateAndSanitizeJSON` is called:

- Valid objects or JSON strings → re-serialized via `JSON.stringify`.
- Invalid or non-serializable input → replaced with `{ "error": "The original input contained errors" }`.

This prevents carrier payload corruption from causing DB insert failures.

### HTTP call failures

`utils.httpRequest` always returns `null` on any HTTP or network error (it never throws). All callers handle a `null` response by logging and skipping the dependent action — HTTP failures are non-fatal at the individual record level.
