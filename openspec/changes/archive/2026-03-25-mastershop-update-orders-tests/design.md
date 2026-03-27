## Context

`Mastershop-UpdateOrders` is an SQS-triggered lambda that processes carrier shipment tracking events. It has a 5-layer architecture (handler → model → dao → dto → utils) and interacts with two external boundaries: a MySQL database (via Sequelize) and HTTP services (Mastershop microservice + error webhook via Axios). The lambda has no existing test coverage.

The testing skill for this project defines a specific approach: tests invoke the handler with a real SQS event object, all internal layers run as-is, and only external boundaries (DB + HTTP) are mocked.

## Goals / Non-Goals

**Goals:**
- Write a single `handler.test.ts` that covers all observable handler behaviors.
- Mock only `../../shared/databases/sequelize` (Database class) and `axios`.
- Cover: happy paths for all 4 source types, invalid records, retry exhaustion, inactive rules, forced execution, linked shipments, return creation, additional steps, and missing env vars.
- Tests must pass with `npm test` without any real infrastructure.

**Non-Goals:**
- Testing model, dao, or dto methods in isolation.
- Integration or E2E tests.
- Modifying any production code.
- Testing every internal branch of the DTO status translation engine.

## Decisions

### Decision 1: Mock the Database class constructor

The `Dao` class instantiates `new Database(environment)` in its constructor. The cleanest mock is to mock the entire `../../shared/databases/sequelize` module with a factory that returns an object with `fetchOne`, `fetchMany`, `insert`, and `update` jest functions. This avoids needing to mock Sequelize internals.

**Alternative considered**: Mock Sequelize directly. Rejected — too deep, couples tests to ORM internals.

### Decision 2: Mock Axios at the module level

All HTTP calls (Mastershop API, error webhook) go through `utils.httpRequest` which uses `axios` directly. Mocking `axios` at the module level (`jest.mock('axios')`) and controlling `axios` (the callable) covers all HTTP paths.

**Alternative considered**: Mock `utils.httpRequest`. Rejected — that would mock an internal layer, violating the testing skill rules.

### Decision 3: One `buildEvent` helper with SQS shape

The handler receives `event.Records[n].body` as a JSON string. The `buildEvent` helper constructs a full valid SQS event with a single record. Tests override only the `body` field (or the whole Records array) to simulate different scenarios.

### Decision 4: Mock Database per test via `mockImplementation`

Since `Database` is a class, the mock returns a constructor that produces an object with jest functions. Each test (or `beforeEach`) configures the return values of `fetchMany`, `fetchOne`, `insert`, and `update` to simulate different DB states.

## Risks / Trade-offs

- [Risk] The retry logic uses `utils.addDelay(30)` which calls `setTimeout` for 30 seconds. → Mitigation: Jest fake timers (`jest.useFakeTimers()`) are NOT needed because we mock the DB to return data on the first attempt in most tests. For retry tests, we configure the DB mock to return `null` on the first N calls and data on the last, so the real delay is never hit (the mock resolves instantly).
- [Risk] `conf/envs.ts` reads env vars at module load time (eagerly). → Mitigation: Set all required env vars in `beforeAll` before importing the handler. Jest module isolation ensures this works.
- [Risk] `Promise.allSettled` in `processValidRecords` swallows errors per record. → Mitigation: Tests assert on the handler's final return value (`statusCode: 200` or `500`) and on whether the error webhook mock was called.
