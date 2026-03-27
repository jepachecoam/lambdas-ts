# Spec: mastershop-update-orders-tests

## Purpose

Defines the handler-level test requirements for the `Mastershop-UpdateOrders` lambda. These requirements describe the expected behavior of the handler under all tested scenarios, including success paths for each order source type, error and retry flows, carrier status edge cases, and environment validation.

---

## Requirements

### Requirement: Handler returns 200 for a valid order record
The handler SHALL return `{ statusCode: 200, body: '"OK"' }` when a valid SQS event is processed successfully for a record whose tracking number resolves to an `order` source.

#### Scenario: Valid order record processed successfully
- **WHEN** the SQS event contains a valid record with `carrierName: "COORDINADORA"`, a numeric `trackingNumber`, and the DB returns order data with `source: "order"`
- **THEN** the handler returns `{ statusCode: 200, body: '"OK"' }`

### Requirement: Handler returns 200 for a valid orderLeg record
The handler SHALL return `{ statusCode: 200, body: '"OK"' }` when a valid SQS event is processed successfully for a record whose tracking number resolves to an `orderLeg` source and the latest leg's `carrierTrackingCode` matches.

#### Scenario: Valid orderLeg record processed successfully
- **WHEN** the SQS event contains a valid record and the DB returns order data with `source: "orderLeg"` and the latest leg's tracking code matches
- **THEN** the handler returns `{ statusCode: 200, body: '"OK"' }`

### Requirement: Handler returns 200 for a valid orderReturn record
The handler SHALL return `{ statusCode: 200, body: '"OK"' }` when a valid SQS event is processed successfully for a record whose tracking number resolves to an `orderReturn` source.

#### Scenario: Valid orderReturn record processed successfully
- **WHEN** the SQS event contains a valid record and the DB returns order data with `source: "orderReturn"`
- **THEN** the handler returns `{ statusCode: 200, body: '"OK"' }`

### Requirement: Handler returns 200 for a valid orderReturnLeg record
The handler SHALL return `{ statusCode: 200, body: '"OK"' }` when a valid SQS event is processed successfully for a record whose tracking number resolves to an `orderReturnLeg` source and the latest return leg's `carrierTrackingCode` matches.

#### Scenario: Valid orderReturnLeg record processed successfully
- **WHEN** the SQS event contains a valid record and the DB returns order data with `source: "orderReturnLeg"` and the latest return leg's tracking code matches
- **THEN** the handler returns `{ statusCode: 200, body: '"OK"' }`

### Requirement: Handler sends error notification for invalid record schema
The handler SHALL call the error webhook and return `{ statusCode: 200 }` when a record fails Zod schema validation (e.g., non-numeric `trackingNumber`).

#### Scenario: Record with invalid trackingNumber format
- **WHEN** the SQS event contains a record with `trackingNumber: "ABC"` (non-numeric)
- **THEN** the handler returns `{ statusCode: 200 }` and the error webhook is called

### Requirement: Handler sends error notification for unknown carrier
The handler SHALL call the error webhook and return `{ statusCode: 200 }` when a record has a `carrierName` not in the supported carrier map.

#### Scenario: Record with unknown carrier name
- **WHEN** the SQS event contains a record with `carrierName: "UNKNOWN_CARRIER"`
- **THEN** the handler returns `{ statusCode: 200 }` and the error webhook is called

### Requirement: Handler retries records not found in DB and sends error after exhaustion
The handler SHALL retry records whose tracking number is not found in the DB up to 3 times and send an error notification after all retries are exhausted.

#### Scenario: Tracking number not found after all retries
- **WHEN** the DB consistently returns `null` for `getDataByCarrierTrackingNumber` across all 3 attempts
- **THEN** the handler returns `{ statusCode: 200 }` and the error webhook is called after the final attempt

### Requirement: Handler skips record when carrier status code is not found
The handler SHALL call the error webhook and skip the record when the carrier status code is not present in the `carrierStatusUpdate` table.

#### Scenario: Status code not found in carrier config
- **WHEN** the DB returns carrier status data that does not include the record's `statusCode`
- **THEN** the handler returns `{ statusCode: 200 }` and the error webhook is called

### Requirement: Handler skips record when carrier status rule is inactive
The handler SHALL skip processing (no DB writes, no API calls) when the matched carrier status rule has `isActive: false` and `forcedExecution` is not set.

#### Scenario: Inactive carrier status rule without forced execution
- **WHEN** the matched carrier status has `isActive: false` and the record does not include `forcedExecution: true`
- **THEN** the handler returns `{ statusCode: 200 }` and no order update API call is made

### Requirement: Handler processes record when forcedExecution overrides inactive rule
The handler SHALL process the record normally when `forcedExecution: true` is present even if the matched carrier status rule has `isActive: false`.

#### Scenario: Forced execution with inactive rule
- **WHEN** the matched carrier status has `isActive: false` and the record includes `forcedExecution: true`
- **THEN** the handler returns `{ statusCode: 200 }` and the order update API is called

### Requirement: Handler creates orderReturn when status maps to idStatus 10
The handler SHALL call `createOrderReturnIfNotExists` when the carrier status code maps to `idStatus: 10` (return code).

#### Scenario: Status triggers return creation
- **WHEN** the carrier status maps to `idStatus: 10` and `returnProcess.returnTrackingNumber` is provided
- **THEN** the handler returns `{ statusCode: 200 }` and the DB insert for `orderReturn` is called

### Requirement: Handler creates orderLeg when status is tagged LINKED-SHIPMENT for order source
The handler SHALL call `createOrderLeg` when the carrier status has `statusAuxLabel: "LINKED-SHIPMENT"` and the source is `order` or `orderLeg`.

#### Scenario: Linked shipment creates new order leg
- **WHEN** the carrier status has `statusAuxLabel: "LINKED-SHIPMENT"` and `linkedShipment.linkedCarrierTrackingCode` is provided
- **THEN** the handler returns `{ statusCode: 200 }` and the DB insert for `orderLeg` is called

### Requirement: Handler creates orderReturnLeg when status is tagged LINKED-SHIPMENT for orderReturn source
The handler SHALL call `createOrderReturnLeg` when the carrier status has `statusAuxLabel: "LINKED-SHIPMENT"` and the source is `orderReturn` or `orderReturnLeg`.

#### Scenario: Linked shipment creates new order return leg
- **WHEN** the carrier status has `statusAuxLabel: "LINKED-SHIPMENT"`, source is `orderReturn`, and `linkedShipment.linkedCarrierTrackingCode` is provided
- **THEN** the handler returns `{ statusCode: 200 }` and the DB insert for `orderReturnLeg` is called

### Requirement: Handler sends additional steps event when requiresAdditionalSteps is true
The handler SHALL call the Mastershop `processevents` endpoint when the matched carrier status or shipment update has `requiresAdditionalSteps: true`.

#### Scenario: Additional steps event dispatched
- **WHEN** the matched carrier status has `requiresAdditionalSteps: true`
- **THEN** the handler returns `{ statusCode: 200 }` and the processevents API is called

### Requirement: Handler applies status 8 intermediate transition
The handler SHALL issue two consecutive PUT calls (first to `idStatus: 6`, then to `idStatus: 8`) when transitioning an order to `idStatus: 8` and the current order status is neither 6 nor 8.

#### Scenario: Status 8 requires intermediate transition through status 6
- **WHEN** the carrier status maps to `idStatus: 8` and the current order `id_status` is neither 6 nor 8
- **THEN** the handler returns `{ statusCode: 200 }` and two PUT order API calls are made

### Requirement: Handler skips orderLeg record when latest leg tracking code does not match
The handler SHALL silently skip the record when the source is `orderLeg` and the latest leg's `carrierTrackingCode` does not match the event's `trackingNumber`.

#### Scenario: OrderLeg tracking code mismatch
- **WHEN** source is `orderLeg` and the latest leg's `carrierTrackingCode` differs from the event's `trackingNumber`
- **THEN** the handler returns `{ statusCode: 200 }` and no order update API call is made

### Requirement: Handler skips orderReturnLeg record when latest return leg tracking code does not match
The handler SHALL silently skip the record when the source is `orderReturnLeg` and the latest return leg's `carrierTrackingCode` does not match the event's `trackingNumber`.

#### Scenario: OrderReturnLeg tracking code mismatch
- **WHEN** source is `orderReturnLeg` and the latest return leg's `carrierTrackingCode` differs from the event's `trackingNumber`
- **THEN** the handler returns `{ statusCode: 200 }` and no order return update DB call is made

### Requirement: Handler skips duplicate shipment update history record
The handler SHALL return `{ statusCode: 200 }` and skip further processing for a record when `createOrderShipmentUpdateHistoryIfNotExists` returns falsy (duplicate detected).

#### Scenario: Duplicate shipment update history
- **WHEN** `createOrderShipmentUpdateHistoryIfNotExists` returns `false` (row already exists)
- **THEN** the handler returns `{ statusCode: 200 }` and no order update API call is made

### Requirement: Handler returns 500 when event parsing throws
The handler SHALL return `{ statusCode: 500 }` when the SQS event is malformed and cannot be parsed.

#### Scenario: Malformed SQS event
- **WHEN** the event has no `Records` array
- **THEN** the handler returns `{ statusCode: 500 }`

### Requirement: Handler returns 500 when a required environment variable is missing
The handler SHALL return `{ statusCode: 500 }` when a required environment variable (e.g., `BASE_URL_MS`) is missing at invocation time.

#### Scenario: Missing required environment variable
- **WHEN** `BASE_URL_MS` is deleted from `process.env` before invocation
- **THEN** the handler returns `{ statusCode: 500 }`

### Requirement: Handler applies CON-NOVEDAD novelty code override
The handler SHALL override the status to `idStatus: 6` and resolve `idShipmentUpdate` from the novelty code when the carrier status is tagged `statusAuxLabel: "CON-NOVEDAD"`.

#### Scenario: CON-NOVEDAD status with matching novelty code
- **WHEN** the carrier status has `statusAuxLabel: "CON-NOVEDAD"` and `novelty.noveltyCode` matches a shipment update entry
- **THEN** the handler returns `{ statusCode: 200 }` and the order is updated with `idStatus: 6`

#### Scenario: CON-NOVEDAD status with no matching novelty code uses fallback 505
- **WHEN** the carrier status has `statusAuxLabel: "CON-NOVEDAD"` and `novelty.noveltyCode` does not match any shipment update entry
- **THEN** the handler returns `{ statusCode: 200 }` and `idShipmentUpdate: 505` is used as fallback
