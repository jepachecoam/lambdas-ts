# Mastershop Shopify Data Normalizer Lambda Function

## Overview

This Lambda function normalizes Shopify order data for integration with the Mastershop platform. It retrieves order information from Shopify using the Shopify API, transforms the data into a standardized format compatible with Mastershop's order management system, and provides error handling with Slack notifications for monitoring and alerting.

## Purpose

The Mastershop Shopify data normalizer function is designed to:
- Retrieve order data from Shopify stores using the Shopify API
- Transform and normalize Shopify order data into Mastershop-compatible format
- Validate required parameters including access tokens and store URLs
- Handle authentication and authorization for Shopify API access
- Provide comprehensive error handling with detailed logging
- Send Slack alerts for critical errors and processing failures
- Support multiple environments (dev, prod) for different deployment stages
- Return standardized HTTP responses for API integration

## Technical Details

### Input

The function expects an HTTP event with the following parameters:

```typescript
{
  // Query parameters or body containing:
  shopifyOrderId: string,      // Required: Shopify order ID to normalize
  shopifyStoreUrl: string,     // Required: Shopify store URL
  shopifyAccessToken: string,  // Required: Shopify API access token
  environment: string          // Required: Environment (dev, prod, etc.)
}
```

### Output

**Success Response (200)**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Success message\",\"data\":{\"normalizedOrderData\":\"...\"}}"
}
```

**Bad Request Response (400)**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Bad request\",\"data\":null}"
}
```

**Forbidden Response (400)**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Forbiden\",\"data\":null}"
}
```

**Unprocessable Entity Response (422)**:
```json
{
  "statusCode": 422,
  "body": "{\"message\":\"Normalization failed message\",\"data\":null}"
}
```

**Internal Server Error Response (500)**:
```json
{
  "statusCode": 500,
  "body": "{\"message\":\"Error interno del servidor\",\"data\":null}"
}
```

### Environment Variables

- **Environment Variables**: Defined in `Envs` type
  - Shopify API configuration
  - Slack webhook configuration for alerts
  - Database connection parameters
  - Environment-specific settings

### Dependencies

- **External APIs**:
  - Shopify API: For retrieving order data
  - Slack API: For error notifications and alerts
- **Shared Utilities**:
  - `../../shared/responses/http` - HTTP response formatting
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter extraction
  - `./model` - Business logic for Shopify data normalization
  - `./types` - Type definitions and environment variables
  - `./utils` - Utility functions including Slack alert functionality

## Setup and Usage

### Local Development

1. Configure environment variables:
   ```bash
   # Shopify API configuration
   export SHOPIFY_API_VERSION=2023-10
   
   # Slack webhook for alerts
   export SLACK_WEBHOOK_URL=your-slack-webhook-url
   
   # Database configuration
   export DB_HOST=your-database-host
   export DB_USER=your-database-user
   export DB_PASSWORD=your-database-password
   ```

2. Ensure Shopify store access:
   - Valid Shopify access token with order read permissions
   - Proper store URL format
   - API rate limiting considerations

### Testing

#### Test Event Structure

```json
{
  "queryStringParameters": {
    "shopifyOrderId": "4567890123456",
    "shopifyStoreUrl": "your-store.myshopify.com",
    "shopifyAccessToken": "shpat_abcdef1234567890",
    "environment": "dev"
  }
}
```

#### Shopify API Requirements

- Valid Shopify Partner account or store access
- API access token with appropriate permissions
- Store URL in correct format (store-name.myshopify.com)
- Order ID must exist in the specified store

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "Mastershop-shopifyDataNormalizer" when prompted
3. Deploy as an HTTP API Lambda function
4. Configure API Gateway for HTTP endpoint access

## Error Handling and Troubleshooting

### Common Errors

1. **"Bad request" (400)**
   - Missing required parameters: `shopifyOrderId`, `environment`, or `shopifyStoreUrl`
   - Verify all required parameters are provided in the request

2. **"Forbiden" (400)**
   - Missing or invalid `shopifyAccessToken`
   - Verify access token is valid and has proper permissions

3. **Normalization Failed (422)**
   - Shopify data doesn't match expected schema
   - Order data cannot be transformed to Mastershop format
   - Check Slack alerts for detailed error information

4. **Internal Server Error (500)**
   - Unhandled exceptions during processing
   - Shopify API connectivity issues
   - Database connection problems

### Slack Alert Integration

The function sends Slack alerts for:
- Normalization failures (422 responses)
- Critical unhandled errors (500 responses)
- Schema validation issues
- API connectivity problems

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify Shopify API credentials and permissions
3. Test Shopify API connectivity independently
4. Check Slack webhook configuration for alert delivery
5. Validate order exists in the specified Shopify store
6. Ensure environment variables are properly configured

## Examples

### Successful Order Normalization

**Request**:
```json
{
  "queryStringParameters": {
    "shopifyOrderId": "4567890123456",
    "shopifyStoreUrl": "example-store.myshopify.com",
    "shopifyAccessToken": "shpat_1234567890abcdef",
    "environment": "prod"
  }
}
```

**Expected Log Output**:
```
Event :>>> {"queryStringParameters":{"shopifyOrderId":"4567890123456",...}}
Context :>>> {"logStreamName":"2024/01/15/[$LATEST]abcdef123456"}
Result: >>> {"success":true,"message":"Order normalized successfully","data":{...}}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Order normalized successfully\",\"data\":{\"orderId\":\"MSHOP-456789\",\"customerInfo\":{...},\"items\":[...],\"shipping\":{...}}}"
}
```

### Missing Required Parameters

**Request**:
```json
{
  "queryStringParameters": {
    "shopifyOrderId": "4567890123456"
    // Missing shopifyStoreUrl and environment
  }
}
```

**Response**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Bad request\",\"data\":null}"
}
```

### Invalid Access Token

**Request**:
```json
{
  "queryStringParameters": {
    "shopifyOrderId": "4567890123456",
    "shopifyStoreUrl": "example-store.myshopify.com",
    "environment": "prod"
    // Missing shopifyAccessToken
  }
}
```

**Response**:
```json
{
  "statusCode": 400,
  "body": "{\"message\":\"Forbiden\",\"data\":null}"
}
```

### Normalization Failure

**Request with Invalid Order**:
```json
{
  "queryStringParameters": {
    "shopifyOrderId": "invalid-order-id",
    "shopifyStoreUrl": "example-store.myshopify.com",
    "shopifyAccessToken": "shpat_1234567890abcdef",
    "environment": "prod"
  }
}
```

**Response**:
```json
{
  "statusCode": 422,
  "body": "{\"message\":\"Order not found or invalid format\",\"data\":null}"
}
```

**Slack Alert Sent**:
```
🚨 Mastershop Shopify Normalizer Alert
Log Stream: 2024/01/15/[$LATEST]abcdef123456
Message: No se normalizo no exito, analizar schema
Data: [Error details]
```

## Data Processing Flow

1. **Event Reception**: Receives HTTP request with Shopify order parameters
2. **Environment Validation**: Validates required environment variables
3. **Parameter Extraction**: Extracts and validates request parameters
4. **Authentication Check**: Validates Shopify access token presence
5. **Model Initialization**: Creates model instance with environment configuration
6. **Order Normalization**: Retrieves and transforms Shopify order data
7. **Response Generation**: Returns success or error response
8. **Error Handling**: Sends Slack alerts for failures and logs errors

## Integration Considerations

- Function serves as a bridge between Shopify and Mastershop systems
- Handles Shopify API rate limiting and authentication
- Provides standardized error responses for API consumers
- Supports multiple environments for different deployment stages
- Integrates with monitoring systems through Slack alerts

## Business Value

- Enables seamless integration between Shopify stores and Mastershop platform
- Standardizes order data format across different e-commerce platforms
- Provides real-time order synchronization capabilities
- Supports multi-store and multi-environment deployments
- Facilitates automated order processing and fulfillment

## Security Considerations

- Secure handling of Shopify access tokens
- Validate API requests to prevent unauthorized access
- Implement proper error handling to prevent data leakage
- Consider rate limiting for API endpoint protection
- Ensure secure communication with external APIs
- Log security-relevant events for monitoring