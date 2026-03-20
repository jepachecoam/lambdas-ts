# blacklist-monitor-wallet

## Purpose

This lambda provides the ability to block or unblock entities from the platform. It serves as the security enforcement point for managing entity access based on fraud detection, compliance requirements, or risk management decisions. When an entity is blocked, it cannot perform transactions or access platform resources.

## What it does

It receives block or unblock requests containing the target entity identifiers. For block requests, it registers the entity in the blacklist system with an active status. For unblock requests, it changes the entity's status to inactive, restoring their access to the platform. The lambda supports blocking users, businesses, and automatically discovers and blocks all associated financial and contact entities.

## Blocking/unblocking flow

1. Validates that the required entity identifiers and action are present in the request.
2. Determines whether the action is a block operation or an unblock operation.
3. For block requests, adds the entity to the blacklist with an active status, enabling fraud prevention.
4. For unblock requests, retrieves all blacklist entries matching the entity and reason, then deactivates them.
5. Returns a success response indicating the operation completed without errors.

## Context injected on success

When blocking or unblocking completes, no specific context is passed downstream. The blacklist system maintains the authoritative state of entity access status, and all subsequent platform operations will consult the blacklist to enforce access decisions.

## Internal layers

- **index**: entry point. Parses the event parameters, validates environment configuration, and dispatches to the appropriate handler.
- **model**: holds all business logic for entity blocking, entity discovery, and status management operations.
- **dao**: data access layer. Retrieves associated entities for a user and queries existing blacklist entries.
- **request**: external API client. Calls the blacklist management system to add or update blacklist entries.
- **dto**: handles input transformation. Extracts action and entity identifiers from the event payload.
- **types**: defines internal constants including status types and action enumerations.
