# processAdditionalStepsInOrdersUpdate

## Purpose

This lambda handles additional carrier-specific processing steps required after initial order status updates. Its sole responsibility is to route shipment events to the appropriate carrier integration and dispatch auxiliary notifications or actions triggered by complex status transitions. It contains no business logic beyond event routing and carrier dispatching.

## What it does

It receives event-driven notifications containing carrier identifiers and order update details. For each event, it determines which carrier is involved (TCC, Envia, Swayp, or Coordinadora), routes the request to the corresponding carrier-specific handler, and optionally dispatches a secondary shipment update event to downstream systems for customer notifications or additional processing. The lambda ensures that carriers requiring extra steps beyond standard status updates are handled according to their specific integration requirements.

## Processing flow

1. Extracts the carrier identifier and event payload from the incoming notification.
2. Determines the execution environment from the event context.
3. If the event is not a standard status update, dispatches a supplementary event containing the order details, carrier status information, and return data.
4. Routes the request to the carrier-specific handler based on the carrier name.
5. Executes carrier-specific processing logic for the identified carrier.
6. Logs successful completion or reports any errors to the monitoring system.

## Context dispatched on success

When additional processing completes, the system may dispatch:

- A supplementary event to the shipment update queue containing order data, carrier status mappings, and return information for downstream notification handlers.

## Internal layers

- **index**: entry point. Validates configuration, extracts parameters from the event, and orchestrates the processing flow.
- **model**: holds all routing logic — event routing to carrier handlers and shipment update dispatching.
- **dao**: data access layer. Fetches order data, carrier status mappings, and sends events to downstream services.
- **dto**: handles data transformation. Extracts parameters from the event payload.
- **api/**: carrier-specific integration modules. Each carrier (tcc, envia, swayp, coordinadora) has its own module with handling logic.
- **types**: defines internal constants and carrier identifiers.
- **utils**: helper functions for HTTP requests and Slack notifications.
