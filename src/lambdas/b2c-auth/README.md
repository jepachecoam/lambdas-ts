# b2c-auth

## Purpose

This lambda acts as an API Gateway authorizer for B2C (Business-to-Consumer) flows. Its sole responsibility is to determine whether an incoming request is authorized before it reaches any internal service. It contains no business logic beyond authentication and authorization decisions.

## What it does

It receives an API Gateway authorization event, validates the identity of the end user through their tokens, verifies consistency between those tokens, and issues an IAM policy of Allow or Deny. When a request targets a specific business context, it also validates the relationship between the user and that business.

## Authorization flow

1. Validates that all required configuration is present before doing any work.
2. Normalizes and sanitizes the request headers.
3. Extracts the user tokens from the headers.
4. Verifies both tokens against the configured identity provider. If the primary verification method fails for the identity token, a secondary fallback mechanism is used.
5. Ensures both tokens belong to the same user. This check is skipped when the fallback verification method was used.
6. Rejects the request if it contains headers that are reserved for internal use and must never be sent by a client.
7. Validates the user's data integrity against the database, ensuring the identity information in the token matches what is stored.
8. If the request includes a business context, validates that the user has an active relationship with that business. The result of this check is cached to avoid redundant lookups on subsequent requests.
9. Issues an Allow policy with contextual data attached, or a Deny policy if any step fails.

## Context injected on success

When authorization succeeds, the lambda enriches the request context so downstream services know who is making the request and in what capacity:

- A client type identifier indicating the request comes from a B2C consumer.
- When a business context is present, identifiers for both the business owner and the requesting user.

## Internal layers

- **index**: entry point. Orchestrates the full authorization flow and builds the final response.
- **model**: holds all authorization logic — token verification, header validation, user integrity checks, and business relationship resolution.
- **dao**: data access layer. Queries the database to verify the user, calls the business relationship service, and manages the cache.
- **dto**: handles input transformation and validation. Sanitizes headers, extracts tokens, and normalizes the method ARN.
- **types**: defines internal constants used throughout the lambda.
- **utils**: internal type definitions, primarily the shape of a decoded token.
