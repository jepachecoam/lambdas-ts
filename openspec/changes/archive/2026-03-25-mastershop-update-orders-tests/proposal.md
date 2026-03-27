## Why

The `Mastershop-UpdateOrders` lambda processes carrier shipment tracking events via SQS and orchestrates complex business logic across multiple entity types (orders, order legs, order returns, return legs). It currently has no automated test coverage, making it risky to modify and difficult to verify correctness after changes. Adding a comprehensive test suite will catch regressions, document expected behavior, and enable safe future development.

## What Changes

- Add a `__tests__/handler.test.ts` file inside `src/lambdas/Mastershop-UpdateOrders/` covering all handler use cases.
- Mock all external dependencies: Sequelize database (`../../shared/databases/sequelize`), Axios HTTP calls (`axios`), and no real infrastructure.
- Cover the full processing pipeline: valid SQS events, invalid records, retry logic, order/orderLeg/orderReturn/orderReturnLeg routing, status translation, linked shipments, return creation, inactive rules, additional steps, and environment misconfiguration.

## Capabilities

### New Capabilities

- `mastershop-update-orders-tests`: Test suite for the `Mastershop-UpdateOrders` lambda handler covering all use cases defined in the lambda's README and source code.

### Modified Capabilities

<!-- No existing spec-level requirements are changing — this is a test-only addition. -->

## Impact

- **New file**: `src/lambdas/Mastershop-UpdateOrders/__tests__/handler.test.ts`
- **No production code changes**: All modifications are test-only.
- **Dependencies**: Jest, `@types/jest`, existing project test infrastructure (`npm test`, `npm run test:lambda`).
- **External mocks required**: `../../shared/databases/sequelize` (Database class), `axios` (HTTP calls).
