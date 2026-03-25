## 1. Test Infrastructure Setup

- [x] 1.1 Create `src/lambdas/Mastershop-UpdateOrders/__tests__/` directory and `handler.test.ts` file
- [x] 1.2 Add `jest.mock` declarations for `../../shared/databases/sequelize` (Database class with `fetchOne`, `fetchMany`, `insert`, `update` jest functions) and `axios`
- [x] 1.3 Import handler and mocked modules after mock declarations
- [x] 1.4 Set all required environment variables in `beforeAll` (`BASE_URL_MS`, `API_KEY_MS`, `APP_NAME_MS`, `URL_WEBHOOK_ERROR_LOGS`, `ENVIRONMENT`, and all DB env vars)
- [x] 1.5 Create `buildEvent` helper that returns a complete valid SQS event with one record body (COORDINADORA carrier, numeric trackingNumber, valid status/novelty/returnProcess/linkedShipment fields)
- [x] 1.6 Create shared DB mock fixtures: `buildDbMocks()` returning `{ fetchOne, fetchMany, insert, update }` jest functions with sensible defaults
- [x] 1.7 Create shared mock setup helpers: `setupValidOrderDb()`, `setupValidOrderLegDb()`, `setupValidOrderReturnDb()`, `setupValidOrderReturnLegDb()` that configure DB mocks for each source type
- [x] 1.8 Add `beforeEach` that calls `jest.clearAllMocks()` and re-applies default mock values

## 2. Success Cases

- [x] 2.1 Write test: valid `order` source record returns `{ statusCode: 200, body: '"OK"' }`
- [x] 2.2 Write test: valid `orderLeg` source record (matching latest leg tracking code) returns `{ statusCode: 200, body: '"OK"' }`
- [x] 2.3 Write test: valid `orderReturn` source record returns `{ statusCode: 200, body: '"OK"' }`
- [x] 2.4 Write test: valid `orderReturnLeg` source record (matching latest return leg tracking code) returns `{ statusCode: 200, body: '"OK"' }`
- [x] 2.5 Write test: batch with multiple valid records all return `{ statusCode: 200 }`

## 3. Failure — Invalid Input

- [x] 3.1 Write test: record with non-numeric `trackingNumber` (fails Zod) → returns `{ statusCode: 200 }` and error webhook called
- [x] 3.2 Write test: record with unknown `carrierName` → returns `{ statusCode: 200 }` and error webhook called
- [x] 3.3 Write test: record with missing required field (`status.statusCode`) → returns `{ statusCode: 200 }` and error webhook called

## 4. Failure — Business Rules

- [x] 4.1 Write test: carrier status code not found in `carrierStatusUpdate` → returns `{ statusCode: 200 }` and error webhook called
- [x] 4.2 Write test: inactive carrier status rule without `forcedExecution` → returns `{ statusCode: 200 }` and no order update API call made
- [x] 4.3 Write test: inactive carrier status rule with `forcedExecution: true` → returns `{ statusCode: 200 }` and order update API is called
- [x] 4.4 Write test: `orderLeg` source with latest leg tracking code mismatch → returns `{ statusCode: 200 }` and no order update API call made
- [x] 4.5 Write test: `orderReturnLeg` source with latest return leg tracking code mismatch → returns `{ statusCode: 200 }` and no DB update called
- [x] 4.6 Write test: duplicate shipment update history (`createOrderShipmentUpdateHistoryIfNotExists` returns `false`) → returns `{ statusCode: 200 }` and no order update API call made
- [x] 4.7 Write test: status maps to `idStatus: 8` with current order status neither 6 nor 8 → two PUT order API calls made (first to status 6, then to status 8)

## 5. Failure — Retry Logic

- [x] 5.1 Write test: tracking number not found in DB on all 3 attempts → returns `{ statusCode: 200 }` and error webhook called after exhaustion
- [x] 5.2 Write test: tracking number not found on first attempt but found on second → returns `{ statusCode: 200 }` and record is processed successfully

## 6. Business Rules — Side Effects

- [x] 6.1 Write test: status maps to `idStatus: 10` (return code) → `createOrderReturnIfNotExists` DB insert called
- [x] 6.2 Write test: carrier status tagged `LINKED-SHIPMENT` for `order` source → `createOrderLeg` DB insert called
- [x] 6.3 Write test: carrier status tagged `LINKED-SHIPMENT` for `orderReturn` source → `createOrderReturnLeg` DB insert called
- [x] 6.4 Write test: carrier status has `requiresAdditionalSteps: true` → Mastershop `processevents` API called
- [x] 6.5 Write test: carrier status tagged `CON-NOVEDAD` with matching novelty code → order updated with `idStatus: 6` and correct `idShipmentUpdate`
- [x] 6.6 Write test: carrier status tagged `CON-NOVEDAD` with no matching novelty code → fallback `idShipmentUpdate: 505` used

## 7. Failure — Environment

- [x] 7.1 Write test: `BASE_URL_MS` env var missing → handler returns `{ statusCode: 500 }`
- [x] 7.2 Write test: malformed SQS event (no `Records` array) → handler returns `{ statusCode: 500 }`

## 8. Verification

- [x] 8.1 Run `npm test` and confirm all tests pass with no TypeScript or ESLint errors
