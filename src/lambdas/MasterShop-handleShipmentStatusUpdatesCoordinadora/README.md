# MasterShop Handle Shipment Status Updates Coordinadora Lambda Function

## Overview

This Lambda function processes shipment status updates from Coordinadora carrier for MasterShop orders. It handles incoming webhook events, validates shipment data, updates order history status, and manages conversation records for tracking purposes. The function is designed to integrate with Coordinadora's tracking system and maintain accurate shipment status in the MasterShop platform.

## Purpose

The MasterShop shipment status updates function is designed to:
- Process webhook events from Coordinadora carrier with shipment status updates
- Validate and extract shipment tracking information from incoming events
- Retrieve order source information and associated shipment data
- Update order history status based on shipment progress
- Save conversation records for order tracking and customer service
- Handle different order sources (orders vs other shipment types)
- Provide appropriate HTTP responses for webhook acknowledgment

## Technical Details

### Input

The function expects a webhook event from Coordinadora with the following structure:

```typescript
{
  // Event data containing shipment status information
  eventData: object,           // Required: Shipment status event details
  carrierTrackingCode: string, // Required: Tracking code from Coordinadora
  dateSolution: string,        // Required: Date of status update
  isApprovedSolution: boolean, // Required: Whether the solution is approved
  // Additional webhook metadata
}
```

### Output

**Success Response (Accepted)**:
```json
{
  "statusCode": 202,
  "body": "{\"message\":\"Accepted\"}"
}
```

**Success Response (No Data Found)**:
```json
{
  "statusCode": 202,
  "body": "{\"message\":\"Accepted (no order source found)\"}"
}
```

**Error Response (Missing Data)**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Missing required event data.\"}"
}
```

**Error Response (Server Error)**:
```json
{
  "statusCode": 500,
  "body": "{\"message\":\"Internal Server Error\"}"
}
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **Function-Specific Variables**: Defined in `Envs` type
  - Additional configuration for Coordinadora integration
- **AWS_REGION**: AWS region for database operations

### Dependencies

- **AWS Services**:
  - Database services for order and shipment data
- **Shared Utilities**:
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter parsing
  - `./model` - Business logic for shipment processing
  - `./types` - Type definitions and enums including OrderSourceEnum

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

2. Set function-specific environment variables as defined in the Envs type

3. Ensure database tables exist:
   - Order and shipment tracking tables
   - Order history tables
   - Conversation/communication tables

### Testing

#### Test Event Structure

```json
{
  "eventData": {
    "status": "delivered",
    "timestamp": "2024-01-15T10:30:00Z",
    "location": "Bogotá, Colombia"
  },
  "carrierTrackingCode": "COORD123456789",
  "dateSolution": "2024-01-15T10:30:00Z",
  "isApprovedSolution": true
}
```

#### Webhook Integration

- Configure Coordinadora webhook to point to this Lambda function
- Ensure proper authentication and security measures
- Set up API Gateway if needed for webhook endpoint

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "MasterShop-handleShipmentStatusUpdatesCoordinadora" when prompted
3. Deploy as a webhook handler Lambda function
4. Configure API Gateway or direct Lambda URL for webhook endpoint

## Error Handling and Troubleshooting

### Common Errors

1. **"Missing required event data"**
   - Ensure `eventData`, `carrierTrackingCode`, and `dateSolution` are provided
   - Verify webhook payload structure matches expected format

2. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions

3. **Order Source Not Found**
   - Returns 202 status (accepted) but no processing occurs
   - May indicate tracking code doesn't exist in system

4. **Shipment Data Not Found**
   - Returns 202 status (accepted) but limited processing occurs
   - May indicate order exists but shipment data is incomplete

### Order Source Types

The function handles different order sources defined in `OrderSourceEnum`:
- **ORDER**: Standard MasterShop orders (full processing including conversation saving)
- **Other types**: Alternative shipment sources (limited processing)

### Response Codes

- **202 Accepted**: Successfully processed or gracefully handled missing data
- **400 Bad Request**: Missing required event data
- **500 Internal Server Error**: Unexpected processing error

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify Coordinadora webhook configuration and payload format
3. Ensure database schema matches expected structure
4. Check that tracking codes exist in the system
5. Verify environment variables are properly configured

## Examples

### Successful Processing

**Request**:
```json
{
  "eventData": {
    "status": "in_transit",
    "timestamp": "2024-01-15T14:30:00Z",
    "location": "Medellín Distribution Center",
    "details": "Package sorted and loaded for delivery"
  },
  "carrierTrackingCode": "COORD987654321",
  "dateSolution": "2024-01-15T14:30:00Z",
  "isApprovedSolution": true
}
```

**Expected Log Output**:
```
orderSource =>>> ORDER
```

**Response**:
```json
{
  "statusCode": 202,
  "body": "{\"message\":\"Accepted\"}"
}
```

**Database Changes**:
- Order history status updated with new shipment status
- Conversation record saved (if order source is ORDER)
- Tracking information updated

### No Order Source Found

**Request**:
```json
{
  "eventData": {
    "status": "delivered"
  },
  "carrierTrackingCode": "UNKNOWN123",
  "dateSolution": "2024-01-15T14:30:00Z",
  "isApprovedSolution": true
}
```

**Response**:
```json
{
  "statusCode": 202,
  "body": "{\"message\":\"Accepted (no order source found)\"}"
}
```

### Missing Required Data

**Request**:
```json
{
  "eventData": {
    "status": "delivered"
  }
  // Missing carrierTrackingCode and dateSolution
}
```

**Response**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Missing required event data.\"}"
}
```

## Data Processing Flow

1. **Parameter Parsing**: Extracts and validates event parameters
2. **Environment Validation**: Checks required environment variables
3. **Data Validation**: Ensures required event data is present
4. **Order Source Lookup**: Retrieves order source by tracking code
5. **Shipment Data Retrieval**: Gets associated shipment information
6. **Conversation Saving**: Saves tracking conversation (for ORDER source)
7. **History Update**: Updates order history with new status
8. **Response Generation**: Returns appropriate HTTP response

## Integration Considerations

- Function is designed as a webhook endpoint for Coordinadora
- Handles both successful processing and graceful degradation
- Returns 202 status for webhook acknowledgment even when data is missing
- Supports different processing paths based on order source type
- Maintains audit trail through conversation records

## Security Considerations

- Validate webhook authenticity from Coordinadora
- Implement proper error handling to prevent data leakage
- Ensure database access is properly secured
- Consider rate limiting for webhook endpoints
- Log security-relevant events for monitoring