# Mastershop-UpdateOrders

## Purpose

This lambda processes carrier shipment status updates delivered via Amazon SQS. Its sole responsibility is to translate external carrier status events into internal order state changes and propagate those changes to the Mastershop platform and the database. It contains no business logic beyond status translation and order update propagation.

## What it does

It receives batch events containing carrier tracking numbers and their status updates. For each update, it determines which order entity (order, order leg, order return, or return leg) the tracking number belongs to, translates the carrier-specific status to an internal status using a configurable mapping, and writes the status update across the relevant database tables and the Mastershop HTTP API. When a status indicates a return process or a linked shipment to a new carrier, it initiates the appropriate downstream record creation.

## Processing flow

1. Validates and parses each message in the batch, filtering out malformed records.
2. Looks up the order entity associated with each tracking number using a precedence hierarchy that favors legs and returns over base orders.
3. Translates the carrier-specific status code to an internal status using the carrier's configured mapping table.
4. Records the shipment update in the appropriate history table, ensuring idempotency.
5. Updates the order or return status in the database.
6. Calls the Mastershop API to synchronize the status change with the external platform.
7. If the status indicates a return process, creates an order return record.
8. If the status indicates a linked shipment to a new carrier, creates a new leg record with the next carrier's details.
9. If configured, triggers additional downstream processing for statuses that require extra handling.
10. Retries records whose order entity was not found, up to three times with a delay between attempts.

## Context updated on success

When a shipment update is processed, the lambda enriches the system state by:

- Recording the shipment update in the order or return history.
- Updating the order's current status in the database.
- Synchronizing the order status with the Mastershop platform.
- Creating a return record if the status indicates a return.
- Creating a new shipment leg if the carrier handed off to another carrier.

## Internal layers

- **index**: entry point. Validates configuration, parses the SQS event, and delegates to the processing model.
- **model**: holds all processing logic — batch handling, retry loop, status translation, order entity resolution, and side effect orchestration.
- **dao**: data access layer. Performs all database queries for entity lookup and status updates, and makes HTTP calls to the Mastershop API and error notification webhook.
- **dto**: handles data transformation. Validates input records, maps carrier names to identifiers, translates status codes using the carrier's mapping rules, and calculates shipping rates for returns.
- **types**: defines internal constants used throughout the lambda.
- **utils**: helper functions for HTTP requests, data sanitization, and delay handling.
- **conf/**: eagerly-loaded configuration constants for the lambda.
