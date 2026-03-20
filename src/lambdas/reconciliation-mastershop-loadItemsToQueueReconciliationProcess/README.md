# reconciliation-mastershop-loadItemsToQueueReconciliationProcess

## Purpose

This lambda loads unreconciled financial items into a processing queue for the reconciliation workflow. Its sole responsibility is to extract pending charges or payments that have not yet been reconciled and dispatch them in controlled batches to downstream handlers. It contains no business logic beyond data extraction and queue dispatching.

## What it does

It receives an event specifying the operation type (charges or payments) and execution environment. It queries the database for all charge or payment records that have not yet been processed through reconciliation, excluding any items that are already being reconciled or have been resolved. The retrieved items are then sent in configurable batches to a queue endpoint where the reconciliation anomaly checker will process them. The lambda ensures efficient loading of large datasets by processing items in manageable chunks.

## Queue loading flow

1. Validates the operation type and environment from the incoming event.
2. Connects to the appropriate database based on the environment.
3. Queries the database for unreconciled items of the specified type (charges or payments).
4. Excludes items that already have an active reconciliation record with a non-resolved status.
5. Splits the retrieved items into batches of a configured size.
6. Sends each batch to the reconciliation queue for downstream processing.
7. Logs progress and completion status.

## Context dispatched on success

When items are loaded to the queue, the system produces:

- A batch of unreconciled financial items sent to the processing queue.
- The operation type indicator (charges or payments) for downstream filtering.
- Environment context for multi-environment support.

## Internal layers

- **index**: entry point. Validates configuration, parses the event, and orchestrates the loading flow.
- **model**: holds all loading logic — data retrieval, batch splitting, and queue dispatching.
- **dao**: data access layer. Queries the database for unreconciled items and sends batches to the queue endpoint.
- **dto**: handles data transformation. Validates and extracts parameters from the event.
