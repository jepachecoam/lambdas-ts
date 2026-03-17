# agent_docs/skills/testing.md

How to write tests for lambdas in this project.
Load this skill before creating or modifying any test file.

---

## What kind of tests these are

Tests in this project are not unit tests and not E2E tests. They sit in between: the handler runs with real internal logic (model, dao, dto), but external dependencies are replaced with mocks. This means:

- No real database connections
- No real HTTP calls to external services
- No real tokens or AWS credentials
- No running infrastructure of any kind

The test invokes the handler the same way AWS does — with an event object — and asserts on the returned value.

---

## What to test

Test the **output of the handler**, not how it produces it.

Each lambda returns something when invoked. That return value is what tests assert on. The specific fields depend on what the lambda does — a lambda that returns an HTTP response has different fields than one that returns an authorization policy or a processed result. Read the lambda's code to understand its output shape before writing tests.

Do not test model methods, dao methods, or dto functions directly. Those are internal implementation details. If they are renamed, extracted, or refactored and the handler output stays correct, tests must not break.

---

## What to mock

Mock only the **external boundaries** — anything that requires infrastructure that does not exist in a test environment:

- Database connections
- Cache or Redis clients
- External HTTP services
- AWS SDK clients (Secrets Manager, S3, SQS, etc.)
- Third-party authentication verifiers

Never mock the lambda's own internal layers (model, dao, dto). They run as-is. Their logic is validated through the handler output.

Cast mocked modules using `as unknown as jest.Mock` to avoid TypeScript inference issues with opaque return types:

```typescript
const mockDb = dbSm as unknown as jest.Mock;
const mockAxiosGet = axios.get as unknown as jest.Mock;
```

---

## File location

Tests live inside the lambda folder under `__tests__/`:

```
src/lambdas/<lambda-name>/
└── __tests__/
    └── handler.test.ts
```

One file per lambda, always named `handler.test.ts`.

---

## Structure of the test file

**1. Declare all `jest.mock()` calls first**, before any imports. Jest hoists them automatically but keeping them at the top makes intent clear.

**2. Import the handler and mocked modules after the mock declarations.**

**3. Set environment variables in `beforeAll`** using bracket notation — the tsconfig enforces `noPropertyAccessFromIndexSignature`:

```typescript
beforeAll(() => {
  process.env["SOME_VAR"] = "value";
});
```

If a test deletes an env var, restore it after:

```typescript
const original = process.env["SOME_VAR"];
delete process.env["SOME_VAR"];
// ... test
process.env["SOME_VAR"] = original;
```

**4. Create a `buildEvent` helper** that returns a complete valid event. Each test overrides only what differs from the happy path:

```typescript
const buildEvent = (
  overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
  // complete valid event for this lambda
  ...overrides
});
```

**5. Extract repeated mock setup into named helpers** to keep tests readable:

```typescript
const setupValidDependency = () => {
  (mockSomething as jest.Mock).mockResolvedValue({ ... });
};
```

**6. Reset mocks in `beforeEach`** and re-apply defaults so each test starts clean:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // re-apply default mock values
});
```

---

## Structuring test cases

Group by outcome using nested `describe` blocks:

```
describe("<lambda-name> handler")
  describe("success cases")
    it("returns the expected output for a valid request")
    it("returns the expected output when optional field X is present")
    ...
  describe("failure — missing input")
    it("returns error output when required field X is missing")
    ...
  describe("failure — business rules")
    it("returns error output when entity is not found")
    it("returns error output when status is inactive")
    ...
  describe("failure — environment")
    it("returns error output when a required env var is missing")
```

Each `it` description describes what the handler does, not what internal code runs.

---

## Cases to cover

**Happy path**: the fully valid request produces the correct output with all expected fields.

**Each required input missing or invalid**: every required header, body field, or parameter whose absence changes the output.

**Each business rule that changes the output**: conditions that result in different response shapes, status codes, or error messages.

**Data not found**: when the lambda queries a database or external service and the expected record does not exist.

**Environment misconfiguration**: at least one test verifying that a missing required environment variable produces an error output instead of crashing unhandled.

**Output shape variants**: if the lambda behaves differently based on the trigger type (e.g. REST vs HTTP API Gateway) or other structural differences in the event, cover each variant.

---

## Running tests

```bash
# Run all tests in the project
npm test

# Interactive CLI — select a lambda by number (same UX as the build script)
npm run test:lambda
```

---

## Project-specific rules

**Jest globals** (`describe`, `it`, `expect`, `jest`, `beforeAll`, `beforeEach`) are available without importing them. Do not import from `@jest/globals` — the project uses `@types/jest` globals configured via `tsconfig.json` and `eslint.config.mjs`.

**Import order** is enforced by the `simple-import-sort` ESLint plugin. The pre-commit hook fixes it automatically.

**Test files follow the same ESLint and TypeScript rules as production code.** No exceptions.

---

## What not to do

- Do not test internal functions (model, dao, dto) in isolation
- Do not use real infrastructure, credentials, or tokens
- Do not assert on how many times an internal function was called
- Do not write tests that break when internals change but the output stays correct
- Do not import Jest from `@jest/globals`
