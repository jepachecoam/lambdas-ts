# MasterShop-handleShipmentUpdatesCoordinadora

## Purpose

This lambda acts as the webhook endpoint for receiving shipment incident notifications from the Coordinadora carrier. It handles all types of shipment anomalies, exceptions, and status change events that the carrier reports during the delivery process.

## What it does

It receives webhook payloads from the carrier containing incident reports, converts the carrier-specific data format into the internal system format, and forwards the normalized shipment data to the order management service for processing. The lambda serves as the integration bridge between the external carrier system and the internal order management domain.

## Incident notification flow

1. Receives the webhook notification from the carrier system.
2. Extracts the shipment tracking number from the notification payload.
3. Identifies the incident type and status code from the carrier's classification system.
4. Transforms the carrier-specific fields into the normalized internal data structure.
5. Enriches the notification with metadata indicating the carrier source and processing timestamp.
6. Forwards the transformed data to the order management service for incident processing.
7. Returns an acknowledgment response to the carrier indicating successful receipt.

## Context injected on success

When the notification is processed successfully, the order management service receives:

- A normalized tracking number identifier.
- The incident classification code and human-readable status name.
- The incident details and description from the carrier.
- Metadata indicating the notification originated from the carrier integration.

## Internal layers

- **index**: entry point. Parses the webhook body, validates basic structure, and initiates the transformation pipeline.
- **model**: contains business logic for data transformation and service invocation.
- **dao**: not used in this lambda — all data is passed forward to downstream services.
- **dto**: handles input parsing. Extracts fields from the carrier's payload format and normalizes the tracking number.
- **types**: defines internal constants and status mappings.
