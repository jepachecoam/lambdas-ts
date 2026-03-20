# b2b-auth

## Purpose

This lambda acts as an API Gateway authorizer for B2B (Business-to-Business) flows. Its sole responsibility is to determine whether an incoming application request is authorized before it reaches any internal service. It contains no business logic beyond authentication and authorization decisions for partner applications.

## What it does

It receives an API Gateway authorization event, validates the identity of the calling application through its API key, checks the application's active status and granted permissions, and issues an IAM policy of Allow or Deny. The permission check supports pattern-based access control with wildcards and explicit deny rules that take precedence.

## Authorization flow

1. Extracts and validates the required headers from the incoming request.
2. Normalizes the resource path to a consistent format.
3. Retrieves the stored API keys from the secrets manager.
4. Verifies the application exists and the provided key matches the stored secret.
5. Fetches the application's access control configuration, including scopes and active status.
6. Checks for explicit deny rules that would block this request.
7. Grants access if the application has wildcard permissions.
8. Evaluates whether the requested method and path are covered by the granted scopes.
9. Issues an Allow policy with contextual data attached, or a Deny policy if any step fails.

## Context injected on success

When authorization succeeds, the lambda enriches the request context so downstream services know which application is making the request and in what capacity:

- A client type identifier indicating the request comes from a B2B partner.
- The authorized application name.

## Internal layers

- **index**: entry point. Orchestrates the full authorization flow and builds the final response.
- **model**: holds all authorization logic — API key validation, scope checking, deny rule evaluation, and pattern matching.
- **dao**: data access layer. Retrieves API keys from the secrets manager and access control configurations from the key-value store.
- **dto**: handles input transformation and validation. Extracts headers, normalizes resource paths, and generates IAM policies.
