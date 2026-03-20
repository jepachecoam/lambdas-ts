# Mastershop-shopifyDataNormalizer

## Purpose

This lambda transforms Shopify order data into the standardized format required by the Mastershop platform. Its sole responsibility is to normalize raw e-commerce data into a consistent structure that downstream services can process reliably. It contains no business logic beyond data transformation and validation.

## What it does

It receives a request containing a Shopify order identifier and authentication credentials. It retrieves the complete order from Shopify using the GraphQL API, transforms the data to match the Mastershop schema, applies intelligent fallback rules when data is missing, and forwards the normalized order to the Mastershop order processing endpoint. The transformation handles address normalization, payment method standardization, customer data mapping, and line item extraction.

## Normalization flow

1. Validates that all required authentication and identification parameters are present.
2. Retrieves the complete order data from Shopify, including customer, addresses, line items, and custom attributes.
3. Normalizes the billing and shipping addresses, using fallback sources when primary data is missing.
4. Maps customer information to the target schema, filling gaps from alternative sources.
5. Detects and standardizes the payment method, identifying cash-on-delivery variations through fuzzy matching.
6. Validates the normalized data against the expected schema structure.
7. Sends the normalized order to the Mastershop order processing service.
8. Returns a success response with the processing results or an error indicating why normalization failed.

## Context produced on success

When an order is normalized, the system produces:

- A standardized order record with billing and shipping addresses.
- A customer profile with contact information and document data.
- A list of order line items with quantities and pricing.
- Flags indicating whether fallback mechanisms were used for missing data.

## Internal layers

- **index**: entry point. Validates request parameters, orchestrates the normalization flow, and builds the HTTP response.
- **model**: holds all transformation logic — order retrieval, data normalization, fallback application, and external service calls.
- **dao**: external integration layer. Fetches data from Shopify via GraphQL and posts normalized orders to the Mastershop API.
- **dto**: handles data transformation. Normalizes addresses, maps customer data, detects payment method types, and builds the payloads for downstream services.
- **types**: defines internal constants and schema types for validation.
- **schema**: defines the expected data structure for normalized orders.
- **utils**: helper functions for HTTP responses and error notifications.
