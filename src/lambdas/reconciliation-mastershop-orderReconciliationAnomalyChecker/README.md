# reconciliation-mastershop-orderReconciliationAnomalyChecker

## Purpose

This lambda validates financial reconciliation records by comparing carrier charges and payments against expected amounts based on the negotiated terms for each order. Its sole responsibility is to detect discrepancies and anomalies in the financial data and record the reconciliation outcome. It contains no business logic beyond financial comparison and anomaly detection.

## What it does

It receives a batch of reconciliation records containing carrier charges or customer payments. For each record, it looks up the associated order using the tracking number, applies the carrier-specific reconciliation formula to compute the expected amount, compares the actual amount against the expected amount, and stores the reconciliation result with a status indicating whether the record is balanced, has an anomaly, or could not be processed. The reconciliation handles both orders and returns, and applies different formulas for each supported carrier.

## Reconciliation flow

1. Parses the incoming batch of reconciliation records from the event.
2. For each record, determines whether it represents a charge or a payment.
3. Looks up the associated order using the carrier tracking number, checking orders first and then returns.
4. If no order is found, records the reconciliation with an order-not-found status.
5. Applies the appropriate carrier-specific formula to calculate the expected amount based on the order's negotiated terms.
6. Compares the actual amount against the expected amount to determine balance or discrepancy.
7. Stores the reconciliation result, including the computed balance and any anomaly flags.
8. Continues with the next record until all records are processed.

## Context stored on success

When a reconciliation completes, the system stores:

- The reconciliation status indicating whether the record is balanced or has a discrepancy.
- The computed balance difference between expected and actual amounts.
- References to the affected order or return.
- Any error status if the reconciliation could not be completed.

## Internal layers

- **index**: entry point. Validates configuration, parses the event, and delegates processing to the model.
- **model**: holds all reconciliation logic — record processing, order lookup, formula application, and balance calculation.
- **dao**: data access layer. Queries orders and returns from the database and upserts reconciliation results.
- **dto**: handles data transformation. Parses the incoming event and extracts parameters.
- **types**: defines internal constants, operation types, and result status codes.
- **formula**: carrier-specific calculation formulas for determining expected charge and payment amounts.
