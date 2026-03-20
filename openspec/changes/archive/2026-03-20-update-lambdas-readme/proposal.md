## Why

The existing lambda READMEs are written as implementation references — they document variable names, JSON schemas, SQL tables, code snippets, and internal method calls. This couples the documentation to the implementation details, making it harder to understand what a lambda actually does at a conceptual level. The goal is to make each README communicate the _purpose and behavior_ of the lambda, not its internal mechanics.

## What Changes

- Rewrite all lambda READMEs to describe each lambda's purpose, responsibilities, and expected behavior in plain language.
- Remove all implementation-specific content: no variable names, no JSON schemas, no SQL tables, no code snippets, no internal method or class references.
- Structure each README consistently: purpose, what it does, the high-level flow, what it produces or emits, and a brief description of internal layers.
- Use `b2c-auth/README.md` as the canonical style reference.

Affected lambdas:

- `b2b-auth`
- `Mastershop-UpdateOrders`
- `Mastershop-Preload-Customer-Statistic`
- `Mastershop-GenerateInvoiceStatementGMF`
- `Mastershop-ProductApprovalAIReviewer`
- `Mastershop-shopifyDataNormalizer`
- `reconciliation-mastershop-orderReconciliationAnomalyChecker`
- `reconciliation-mastershop-loadItemsToQueueReconciliationProcess`
- `reconciliation-checkReconciliationDocumentAndLoadItemsToDb`
- `inteliflete-statistics`
- `MasterShop-handleShipmentStatusUpdatesCoordinadora`
- `MasterShop-handleShipmentUpdatesCoordinadora`
- `blacklist-monitor-wallet`
- `processAdditionalStepsInOrdersUpdate`

## Capabilities

### New Capabilities

- `lambda-readme-style`: Defines the conceptual documentation style for lambda READMEs — purpose-focused, implementation-agnostic, structured consistently across all lambdas.

### Modified Capabilities

_(none — this is a documentation change, not a behavioral one)_

## Impact

- All `README.md` files under `src/lambdas/` except `b2c-auth` (already compliant).
- No code changes. No API changes. No deployment impact.
- Improves onboarding: new engineers can understand what each lambda does without reading source code.
