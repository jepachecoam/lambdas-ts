# Process Additional Steps In Orders Update Lambda Function

## Overview

This Lambda function processes additional steps required during order updates for multiple shipping carriers. It handles carrier-specific processing logic for TCC, Envia, and Swayp carriers, dispatches shipment updates, and manages carrier-specific API integrations. The function is designed to be triggered by events containing order update information and performs additional processing steps based on the carrier type.

## Purpose

The process additional steps function is designed to:
- Process carrier-specific additional steps during order updates
- Handle shipment updates for multiple carriers (TCC, Envia, Swayp)
- Dispatch shipment update notifications to relevant systems
- Manage carrier-specific API integrations and processing logic
- Support extensible carrier handling through modular API handlers
- Provide centralized processing for post-order-update operations
- Handle event-driven processing with detailed logging

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  carrier: string,        // Required: Carrier name (tcc, envia, swayp)
  detail: object,         // Required: Order/shipment detail information
  eventProcess: object    // Required: Event processing context and metadata
}
```

### Output

The function does not return a specific response structure. It performs processing operations and logs the results. Success is indicated through console logs and completion of carrier-specific operations.

**Console Output Example**:
```
Finished
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **Function-Specific Variables**: Defined in `EnvsEnum`
  - Carrier-specific API configurations
  - Integration endpoints and credentials

### Dependencies

- **AWS Services**:
  - Database services for order and shipment data
- **Shared Utilities**:
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter extraction
  - `./model` - Business logic for shipment update dispatching
  - `./types` - Type definitions including Carriers enum and EnvsEnum
  - `./api/envia` - Envia carrier-specific processing
  - `./api/swayp` - Swayp carrier-specific processing
  - `./api/tcc` - TCC carrier-specific processing

## Setup and Usage

### Local Development

1. Configure database connection parameters:
   ```bash
   # Set required database environment variables
   export DB_HOST=your-database-host
   export DB_USER=your-database-user
   export DB_PASSWORD=your-database-password
   export DB_NAME=your-database-name
   ```

2. Configure carrier-specific environment variables as defined in EnvsEnum

3. Ensure carrier API endpoints and credentials are properly configured

### Testing

#### Test Event Structure

**TCC Carrier Event**:
```json
{
  "carrier": "tcc",
  "detail": {
    "orderId": "ORD123456",
    "trackingNumber": "TCC789012345",
    "status": "shipped",
    "customerInfo": {...}
  },
  "eventProcess": {
    "eventId": "evt_123",
    "timestamp": "2024-01-15T14:30:00Z",
    "source": "order-management"
  }
}
```

**Envia Carrier Event**:
```json
{
  "carrier": "envia",
  "detail": {
    "orderId": "ORD789012",
    "trackingNumber": "ENV345678901",
    "status": "in_transit",
    "deliveryInfo": {...}
  },
  "eventProcess": {
    "eventId": "evt_456",
    "timestamp": "2024-01-15T15:00:00Z",
    "source": "shipping-system"
  }
}
```

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "processAdditionalStepsInOrdersUpdate" when prompted
3. Deploy as an event-driven Lambda function
4. Configure appropriate triggers (SQS, EventBridge, etc.)

## Error Handling and Troubleshooting

### Common Errors

1. **Environment Variable Errors**
   - Ensure all required database and carrier-specific environment variables are set
   - Verify environment variable names match those defined in EnvsEnum

2. **Carrier Processing Errors**
   - Check carrier-specific API configurations
   - Verify carrier API endpoints are accessible
   - Ensure proper authentication for carrier APIs

3. **Event Structure Errors**
   - Verify event contains required fields: carrier, detail, eventProcess
   - Check that carrier name matches supported carriers (tcc, envia, swayp)

### Supported Carriers

- **TCC**: Handled by `./api/tcc` module
- **Envia**: Handled by `./api/envia` module
- **Swayp**: Handled by `./api/swayp` module

### Processing Flow

1. **Shipment Update Dispatch**: If detail is provided, dispatches shipment update
2. **Carrier-Specific Processing**: Routes to appropriate carrier handler based on carrier name
3. **Unsupported Carriers**: Logs message for carriers not in the supported list

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify carrier-specific API configurations and credentials
3. Test carrier API connectivity independently
4. Ensure event structure matches expected format
5. Check that carrier handlers are properly implemented
6. Verify database connectivity for shipment updates

## Examples

### Successful TCC Processing

**Request**:
```json
{
  "carrier": "tcc",
  "detail": {
    "orderId": "ORD456789",
    "trackingNumber": "TCC123456789",
    "status": "delivered",
    "deliveryDate": "2024-01-15T16:30:00Z",
    "recipientName": "John Doe"
  },
  "eventProcess": {
    "eventId": "evt_789",
    "timestamp": "2024-01-15T16:35:00Z",
    "source": "delivery-confirmation"
  }
}
```

**Expected Log Output**:
```
Finished
```

**Processing Steps**:
1. Shipment update dispatched for TCC carrier
2. TCC-specific processing executed
3. Additional TCC integration steps completed

### Successful Envia Processing

**Request**:
```json
{
  "carrier": "envia",
  "detail": {
    "orderId": "ORD987654",
    "trackingNumber": "ENV987654321",
    "status": "exception",
    "exceptionReason": "Address not found"
  },
  "eventProcess": {
    "eventId": "evt_012",
    "timestamp": "2024-01-15T17:00:00Z",
    "source": "exception-handler"
  }
}
```

**Processing Steps**:
1. Shipment update dispatched for Envia carrier
2. Envia-specific exception handling executed
3. Customer notification processes triggered

### Unsupported Carrier

**Request**:
```json
{
  "carrier": "unknown-carrier",
  "detail": {...},
  "eventProcess": {...}
}
```

**Expected Log Output**:
```
Not found cases to hanlde for carrier: unknown-carrier
Finished
```

### Error Scenario

**Request with Missing Detail**:
```json
{
  "carrier": "tcc",
  "eventProcess": {...}
  // Missing detail field
}
```

**Expected Behavior**:
- Shipment update dispatch skipped (no detail provided)
- TCC processing continues with available data
- Function completes successfully

## Data Processing Flow

1. **Environment Validation**: Validates required environment variables
2. **Parameter Extraction**: Extracts carrier, detail, and eventProcess from event
3. **Conditional Shipment Dispatch**: Dispatches shipment update if detail is provided
4. **Carrier Routing**: Routes to appropriate carrier handler based on carrier name
5. **Carrier Processing**: Executes carrier-specific additional steps
6. **Completion Logging**: Logs successful completion

## Integration Considerations

- Function serves as a central hub for carrier-specific post-processing
- Supports extensible architecture for adding new carriers
- Integrates with multiple carrier APIs and systems
- Handles both successful deliveries and exception scenarios
- Provides consistent processing interface across different carriers

## Business Value

- Enables carrier-specific business logic and integrations
- Supports automated post-order-update processing
- Facilitates multi-carrier shipping operations
- Provides centralized error handling and logging
- Enables scalable addition of new shipping carriers

## Security Considerations

- Secure handling of carrier API credentials
- Validate event data to prevent malicious processing
- Implement proper error handling to prevent data leakage
- Ensure secure communication with carrier APIs
- Log security-relevant events for monitoring
- Consider rate limiting for carrier API calls