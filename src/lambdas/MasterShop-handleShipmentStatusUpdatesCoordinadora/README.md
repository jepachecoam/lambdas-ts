# MasterShop-handleShipmentStatusUpdatesCoordinadora

## Purpose

This lambda processes shipment solution approvals from the Coordinadora carrier. When a carrier reports that a shipment incident has been resolved, this lambda determines whether the solution is acceptable and updates the order history accordingly.

## What it does

It receives solution notifications from the carrier, validates that the shipment exists in the system, determines whether the proposed solution meets business acceptance criteria, and updates the incident status in the order history. For approved solutions, it may automatically close the incident; for rejected solutions, it leaves the incident open for manual review.

## Status approval flow

1. Receives the carrier's solution notification containing the tracking code, solution details, and approval decision.
2. Identifies whether the shipment originates from a standard order or a return order.
3. Retrieves the corresponding shipment incident record from the appropriate data store.
4. Validates that the incident has not already been resolved to prevent duplicate processing.
5. Evaluates whether the proposed solution is approved based on the provided decision flag.
6. For approved solutions, automatically generates resolution metadata including solution type, resolving user, and closure comments.
7. Updates the incident status in the appropriate data store with the resolution information.
8. For order-type shipments, records the resolution conversation for audit purposes.

## Context injected on success

When the status update completes successfully, downstream services receive:

- A 202 Accepted response indicating the solution was processed.
- The incident record is updated with resolved status for approved solutions or remains pending for rejected solutions.

## Internal layers

- **index**: entry point. Receives the event, validates required parameters, and orchestrates the full processing flow.
- **model**: holds all business logic — order source identification, shipment data retrieval, status determination, and history updates.
- **dao**: data access layer. Queries incident records, determines if the shipment is an order or return, updates status, and records conversation logs.
- **dto**: handles input transformation and validation. Parses event parameters and normalizes the carrier tracking code.
- **types**: defines internal constants including order source types and status enumeration values.
